import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Form, ProgressBar } from 'react-bootstrap';
// Removed unused import: BiLogoBlogger
import Modal from 'react-bootstrap/Modal';
//import { usePollinationsImage } from '@pollinations/react';
const TestApiPage = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  //const [croppedDataUrl, setCroppedDataUrl] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  
  // New states for BHK functionality
  const [selectedBHK, setSelectedBHK] = useState('');
  const [areaValue, setAreaValue] = useState('');
  const [processedPrompt, setProcessedPrompt] = useState('');
  const [imageGenerating, setImageGenerating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [availableAreas, setAvailableAreas] = useState([]);
  const [generationStatus, setGenerationStatus] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [imageLoaded, setImageLoaded] = useState(false);

  // Ref to prevent multiple simultaneous processing
  const isProcessingRef = useRef(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mobile touch events for image modal
  const handleImageInteraction = () => {
    setShowModal(true);
  };

  // Download image in full resolution
  const downloadImage = useCallback(async () => {
    if (!imageUrl) return;
    
    try {
      setLoading(true);
      
      // Fetch the image as blob to maintain original quality
      const response = await fetch(imageUrl, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Determine file extension from content type or URL
      const contentType = response.headers.get('content-type') || 'image/png';
      let extension = 'png';
      if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        extension = 'jpg';
      } else if (contentType.includes('webp')) {
        extension = 'webp';
      } else if (contentType.includes('gif')) {
        extension = 'gif';
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp and BHK info
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const bhkInfo = processedPrompt ? `_${selectedBHK.replace(' ', '')}_${areaValue}sqft` : '';
      link.download = `room-plan${bhkInfo}_${timestamp}.${extension}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message briefly
      const originalError = error;
      setError(`✅ Image downloaded successfully as ${link.download}`);
      setTimeout(() => setError(originalError), 3000);
      
    } catch (err) {
      console.error('Download error:', err);
      setError('Error downloading image: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [imageUrl, processedPrompt, selectedBHK, areaValue, error]); // Dependencies for useCallback

  // Handle keyboard shortcuts for download
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S to download image when modal is open
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && showModal && imageUrl) {
        e.preventDefault();
        downloadImage();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showModal, imageUrl, downloadImage]);

  // Load available areas based on selected BHK type
  const loadAvailableAreas = async (bhkType) => {
    try {
      const jsonResponse = await fetch(`${process.env.PUBLIC_URL}/BHKPrompt/bhk_info.json`);
      if (!jsonResponse.ok) {
        console.error('Failed to load BHK data for areas');
        return;
      }
      
      const bhkData = await jsonResponse.json();
      if (!bhkData.real_estate_configurations || !Array.isArray(bhkData.real_estate_configurations)) {
        console.error('Invalid BHK data structure');
        return;
      }

      // Filter configurations by BHK type and extract unique areas
      const areasForType = bhkData.real_estate_configurations
        .filter(config => config.type === bhkType)
        .map(config => config.total_carpet_area_sqft)
        .sort((a, b) => a - b); // Sort in ascending order

      setAvailableAreas(areasForType);
      
      // Reset area value when BHK type changes
      if (areasForType.length > 0) {
        setAreaValue(areasForType[0].toString()); // Set first available area as default
      } else {
        setAreaValue('');
      }
      
    } catch (err) {
      console.error('Error loading available areas:', err);
      setAvailableAreas([]);
      setAreaValue('');
    }
  };
  
/*
  // Optimize prompt for API reliability
  const optimizePrompt = (prompt) => {
    // Limit prompt length to prevent timeouts
    const maxLength = 500;
    let optimized = prompt.trim();
    
    // If prompt is too long, summarize it
    if (optimized.length > maxLength) {
      // Extract key room information
      const roomMatches = optimized.match(/(\w+\s*\w*)\s*\d+\s*ft\s*X\s*\d+\s*ft/gi);
      if (roomMatches && roomMatches.length > 0) {
        optimized = `Architectural floor plan: ${roomMatches.slice(0, 6).join(', ')}. Modern residential design with proper room layout.`;
      } else {
        optimized = optimized.substring(0, maxLength - 50) + "... Modern residential floor plan design.";
      }
    }
    
    // Add quality keywords for better results
    if (!optimized.toLowerCase().includes('floor plan')) {
      optimized = "Architectural floor plan: " + optimized;
    }
    
    // Add specific instructions for larger floor plan with minimal white space
    optimized += ". IMPORTANT: Floor plan should occupy 80-90% of the image area, large detailed floor plan, minimal white background, fill most of the image space, maximize floor plan size, detailed room labels, thick clear lines, professional architectural drawing with large scale, top view perspective.";
    
    return optimized;
  };
*/
  // BHK processing function
  const handleBHKProcessing = useCallback(async () => {
    // Prevent multiple simultaneous processing
    if (isProcessingRef.current) {
      console.log('BHK processing already in progress, skipping...');
      return;
    }

    isProcessingRef.current = true;
    setLoading(true);
    setError(null);
    setProcessedPrompt('');
    
    try {
      // Validate inputs
      if (!selectedBHK || !areaValue) {
        throw new Error('Please select BHK type and area value');
      }

      const area = parseFloat(areaValue);
      if (isNaN(area) || area <= 0) {
        throw new Error('Please select a valid area value');
      }

      // Load BHK JSON data
      const jsonResponse = await fetch(`${process.env.PUBLIC_URL}/BHKPrompt/bhk_info.json`);
      if (!jsonResponse.ok) {
        throw new Error(`Failed to load BHK data: ${jsonResponse.status} ${jsonResponse.statusText}`);
      }
      
      let bhkData;
      try {
        bhkData = await jsonResponse.json();
      } catch (parseError) {
        throw new Error('Invalid BHK data format. Please check the JSON file.');
      }

      if (!bhkData.real_estate_configurations || !Array.isArray(bhkData.real_estate_configurations)) {
        throw new Error('Invalid BHK data structure. Missing configurations.');
      }

      // Find exact match for BHK type and area (since we're using dropdown values)
      const matchedConfig = bhkData.real_estate_configurations.find(config => 
        config.type === selectedBHK && config.total_carpet_area_sqft === area
      );

      if (!matchedConfig) {
        throw new Error(`No exact configuration found for ${selectedBHK} with ${area} sq ft area`);
      }

      // Load corresponding text file
      const bhkNumber = selectedBHK.charAt(0); // Extract number from "1 BHK", "2 BHK", etc.
      const textFileName = `BHK${bhkNumber}.${bhkNumber === '1' ? 'text' : 'txt'}`;
      const textResponse = await fetch(`${process.env.PUBLIC_URL}/BHKPrompt/${textFileName}`);
      if (!textResponse.ok) {
        throw new Error(`Failed to load template file ${textFileName}: ${textResponse.status} ${textResponse.statusText}`);
      }
      
      let textContent = await textResponse.text();
      if (!textContent || textContent.trim() === '') {
        throw new Error(`Template file ${textFileName} is empty or corrupted`);
      }

      // Replace variables in text content
      let processedContent = textContent;

      // Replace {total_carpet_area_sqft} with the area value
      processedContent = processedContent.replace(/{total_carpet_area_sqft}/g, area.toString());

      // Replace room variables with dimensions
      matchedConfig.rooms.forEach(room => {
        const roomName = room.name;
        const dimensions = room.dimensions_ft;
        
        if (!dimensions || typeof dimensions.length !== 'number' || typeof dimensions.width !== 'number') {
          console.warn(`Invalid dimensions for room: ${roomName}`);
          return;
        }
        
        const dimensionString = `${dimensions.length} x ${dimensions.width}`;
        
        // Create regex patterns for different possible variable names
        const patterns = [
          new RegExp(`{${roomName}}`, 'gi'),
          new RegExp(`{${roomName.toLowerCase()}}`, 'gi'),
          new RegExp(`{${roomName.toLowerCase().replace(/\s+/g, ' ')}}`, 'gi'),
          new RegExp(`{${roomName.toLowerCase().replace(/\s+/g, '')}}`, 'gi')
        ];

        patterns.forEach(pattern => {
          processedContent = processedContent.replace(pattern, dimensionString);
        });
      });

      // Handle special cases for common room name variations
      const roomMappings = {
        'living room': matchedConfig.rooms.find(r => r.name.toLowerCase().includes('living')),
        'kitchen': matchedConfig.rooms.find(r => r.name.toLowerCase().includes('kitchen')),
        'bathroom': matchedConfig.rooms.find(r => r.name.toLowerCase().includes('bathroom')),
        'balcony': matchedConfig.rooms.find(r => r.name.toLowerCase().includes('balcony')),
        'store': matchedConfig.rooms.find(r => r.name.toLowerCase().includes('store'))
      };

      Object.entries(roomMappings).forEach(([key, room]) => {
        if (room && room.dimensions_ft) {
          const dimensionString = `${room.dimensions_ft.length} x ${room.dimensions_ft.width}`;
          processedContent = processedContent.replace(new RegExp(`{${key}}`, 'gi'), dimensionString);
        }
      });

      if (processedContent === textContent) {
        console.warn('No variable replacements were made. Check if template variables match room names.');
      }

      setProcessedPrompt(processedContent);
      
    } catch (err) {
      setError('Error processing BHK data: ' + (err.message || 'Unknown error'));
      console.error('BHK Processing Error:', err);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }, [selectedBHK, areaValue]); // Dependencies for useCallback

  // Load areas when component mounts or BHK type changes
  useEffect(() => {
    loadAvailableAreas(selectedBHK);
  }, [selectedBHK]);

  // Auto-process BHK data when both dropdowns have values
  useEffect(() => {
    // Reset processed prompt when selections change (before auto-processing)
    if (selectedBHK && areaValue) {
      setProcessedPrompt(''); // Clear previous result
    }

    const autoBHKProcessing = async () => {
      // Only process if both values are selected, not currently processing, and areas are loaded
      if (selectedBHK && areaValue && !isProcessingRef.current && availableAreas.length > 0) {
        try {
          console.log('Auto-processing BHK:', selectedBHK, areaValue);
          await handleBHKProcessing();
        } catch (error) {
          console.error('Auto BHK processing failed:', error);
        }
      }
    };

    // Add a small delay to avoid rapid re-processing during dropdown changes
    const timeoutId = setTimeout(autoBHKProcessing, 500); // Increased delay to 500ms
    
    return () => clearTimeout(timeoutId);
  }, [selectedBHK, areaValue, availableAreas, handleBHKProcessing]);

  async function handleTestApi() {
    setLoading(true);
    setImageGenerating(true);
    setError(null);
    setImageUrl('');
    setProgressValue(0);
    setImageLoaded(false);
    
    // Start gradual progress that continues until image loads
    const progressInterval = setInterval(() => {
      setProgressValue(prev => {
        if (prev >= 95) return 95; // Cap at 95% until image loads
        return prev + Math.random() * 3 + 1; // Increase by 1-4% randomly
      });
    }, 200); // Update every 200ms
    
    try {
      // Stage 1: Validating prompt
      setGenerationStatus('Validating prompt...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Use GET method for Pollinations.ai image generation
      const currentPrompt = processedPrompt || prompt;
      
      if (!currentPrompt.trim()) {
        clearInterval(progressInterval);
        throw new Error('Please enter a prompt or process BHK configuration first');
      }
      
      // Stage 2: Optimizing prompt
      setGenerationStatus('Optimizing prompt for better results...');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Optimize prompt for better API reliability
      //const optimizedPrompt = optimizePrompt(currentPrompt);
      const encodedPrompt = encodeURIComponent(currentPrompt);
      
      // Stage 3: Connecting to AI service
      setGenerationStatus('Connecting to AI image generation service...');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Stage 4: Generating image
      setGenerationStatus(`AI is creating your room plan...`);
      //const imageApiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=nanobanana&width=2048&height=2048&enhance=true`;
      const imageApiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=nanobanana`;
      console.log(`Generating image with nanobanana model`);
      setImageUrl(imageApiUrl);
      
      // Progress will continue until image onLoad event fires
      setGenerationStatus('Rendering your room plan...');
      
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Image generation error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Error generating image: ';
      
      if (err.message.includes('524')) {
        errorMessage += 'Server timeout. The image generation service is busy. Please try again in a few moments.';
      } else if (err.message.includes('All image generation models failed')) {
        errorMessage += 'All image generation services are currently unavailable. Please try again later.';
      } else if (err.name === 'AbortError') {
        errorMessage += 'Request timed out. Please try with a shorter prompt or try again later.';
      } else {
        errorMessage += err.message || 'Unknown error. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
      setImageUrl(''); // Clear any previous image on error
    }
  }

  // Function to handle when image is loaded
  const handleImageLoad = () => {
    setImageLoaded(true);
    setProgressValue(100);
    setGenerationStatus('Complete! Your room plan is ready.');
    
    // Hide progress bar after a short delay
    setTimeout(() => {
      setImageGenerating(false);
      setGenerationStatus('');
      setProgressValue(0);
      setLoading(false);
    }, 1500);
  };

  // Function to handle image load error
  const handleImageError = () => {
    setImageLoaded(false);
    setProgressValue(0);
    setImageGenerating(false);
    setLoading(false);
    setError('Failed to load the generated image. Please try again.');
  };

  /* 
  // Gemini API image generation function - HIDDEN
  async function handleGeminiApi() {
    setLoading(true);
    setError(null);
    setImageUrl('');
    //setCroppedDataUrl('');

    try {
      // Example Gemini API endpoint and prompt usage
      // Replace with your actual Gemini API endpoint and authentication if needed
      const currentPrompt = processedPrompt || prompt;
      const response = await fetch('https://api.gemini.com/v1/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt })
      });
      if (!response.ok) {
        const errorText = await response.text();
        setError('Gemini API request failed: ' + errorText);
        setLoading(false);
        return;
      }
      const data = await response.json();
      // Assume API returns { imageUrl: '...' }
      setImageUrl(data.imageUrl || '');
    } catch (err) {
      setError('Network or Gemini API error: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  }
  */

  // eslint-disable-next-line no-unused-vars
  async function handleTestTextPrompt() {
    setLoading(true);
    setError(null);
    setGeneratedText('');
    try {
      // Example Pollinations text generation API endpoint
      // Replace with the actual endpoint if different
      const currentPrompt = processedPrompt || prompt;
      
      if (!currentPrompt.trim()) {
        throw new Error('Please enter a prompt or process BHK configuration first');
      }
      
      const encodedPrompt = encodeURIComponent(currentPrompt);
      const response = await fetch(`https://text.pollinations.ai/${encodedPrompt}?model=openai`);
      if (!response.ok) throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        throw new Error('No text was generated. Please try a different prompt.');
      }
      
      setGeneratedText(text);
    } catch (err) {
      setError('Network or Text API error: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '2rem auto', 
      padding: isMobile ? 16 : 24, 
      background: '#fafafa', 
      borderRadius: 12, 
      boxShadow: '0 2px 8px rgba(33,150,243,0.07)',
      width: isMobile ? 'calc(100% - 20px)' : 'auto'
    }}>
      <h3 style={{ textAlign: 'center', color: '#1976d2', fontWeight: 700 }}>Plan Generation</h3>
      
      {/* BHK Processing Section */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#e8f4fd', borderRadius: 8, border: '1px solid #2196f3' }}>
        <h5 style={{ color: '#1976d2', marginBottom: '1rem' }}>
          BHK Configuration 
          {selectedBHK && areaValue && (
            <small style={{ color: '#4caf50', fontWeight: 'normal', fontSize: '0.8em', marginLeft: '8px' }}>
              ✓ Auto-processing enabled
            </small>
          )}
        </h5>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'end', flexWrap: 'wrap' }}>
          <Form.Group style={{ minWidth: '120px' }}>
            <Form.Label>BHK Type</Form.Label>
            <Form.Select 
              value={selectedBHK} 
              onChange={e => setSelectedBHK(e.target.value)}
              style={{ background: 'white' }}
            >
              <option value="">Select BHK Type</option>
              <option value="1 BHK">1 BHK</option>
              <option value="2 BHK">2 BHK</option>
              <option value="3 BHK">3 BHK</option>
              <option value="4 BHK">4 BHK</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group style={{ minWidth: '120px' }}>
            <Form.Label>Area (sq ft)</Form.Label>
            <Form.Select
              value={areaValue}
              onChange={e => setAreaValue(e.target.value)}
              style={{ background: 'white' }}
              disabled={availableAreas.length === 0}
            >
              <option value="">
                {availableAreas.length === 0 ? 'Loading areas...' : 'Select Area (sq ft)'}
              </option>
              {availableAreas.length > 0 && (
                availableAreas.map(area => (
                  <option key={area} value={area}>
                    {area} sq ft
                  </option>
                ))
              )}
            </Form.Select>
          </Form.Group>
        </div>
      </div>

      <Form.Group className="mb-3">
        <Form.Label>
          Prompt (multiline)
          {selectedBHK && areaValue && processedPrompt && (
            <small style={{ color: '#4caf50', fontWeight: 'normal', fontSize: '0.8em', marginLeft: '8px' }}>
              ✓ Auto-generated from {selectedBHK} - {areaValue} sq ft
            </small>
          )}
        </Form.Label>
        <Form.Control
          as="textarea"
          rows={6}
          value={processedPrompt || prompt}
          onChange={e => {
            if (processedPrompt) {
              setProcessedPrompt(e.target.value);
            } else {
              setPrompt(e.target.value);
            }
          }}
          style={{ fontFamily: 'monospace', fontSize: '1rem', background: '#f4f4f4', borderRadius: 8, border: '1px solid #ccc', padding: 8 }}
        />
      </Form.Group>
      
      {/* Progress Bar for Image Generation */}
      {imageGenerating && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <Form.Label style={{ margin: 0, fontWeight: 600, color: '#1976d2' }}>
              {generationStatus || 'Generating Room Plan...'}
            </Form.Label>
            <small style={{ color: '#666', fontWeight: 600 }}>
              {Math.round(progressValue)}%
            </small>
          </div>
          <ProgressBar 
            now={Math.round(progressValue)} 
            variant={progressValue === 100 ? "success" : "primary"} 
            style={{ height: '12px', borderRadius: '6px' }}
            animated={progressValue < 100}
            striped={progressValue < 100}
          />
          <small style={{ color: '#666', fontSize: '0.85em', marginTop: '0.5rem', display: 'block' }}>
            {progressValue < 20 ? 
              'Preparing your request...' : 
              progressValue < 40 ? 
                'Processing your prompt...' : 
                progressValue < 60 ?
                  'Connecting to AI service...' :
                  progressValue < 80 ?
                    'AI is generating your room plan...' :
                    progressValue < 95 ?
                      'Rendering your image...' :
                      progressValue === 100 ?
                        'Complete! Your room plan is ready.' :
                        'Almost done, finalizing your room plan...'
            }
          </small>
        </div>
      )}
      
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <Button variant="primary" onClick={handleTestApi} disabled={loading} style={{ minWidth: 120, fontWeight: 600 }}>
          {loading ? 'Generating...' : 'Get Room Plan'}
        </Button>
      </div>
      
      {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
      {imageUrl && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <img
            src={imageUrl}
            alt="Generated"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ 
              width: '100%', 
              height: '400px', 
              objectFit: 'contain', 
              borderRadius: 8, 
              boxShadow: '0 2px 8px rgba(33,150,243,0.10)', 
              cursor: 'pointer',
              touchAction: 'manipulation' // Improve touch responsiveness
            }}
            onDoubleClick={handleImageInteraction}
            onClick={(e) => {
              // Handle single click/tap on mobile and desktop
              if (isMobile) {
                handleImageInteraction();
              }
            }}
          />
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
            {isMobile ? 'Tap to view in full screen' : 'Double-click to view in full screen'}
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={downloadImage}
              disabled={loading}
              style={{ minWidth: '120px' }}
            >
              {loading ? 'Downloading...' : '📥 Download HD'}
            </Button>
          </div>
          <Modal 
            show={showModal} 
            onHide={() => setShowModal(false)} 
            fullscreen={true}
            backdrop="static"
            keyboard={true}
          >
            <Modal.Header 
              closeButton 
              style={{ 
                background: '#e3f2fd', 
                borderBottom: '1px solid #1976d2',
                position: 'relative',
                zIndex: 1050,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Modal.Title style={{ fontWeight: 700, color: '#1976d2' }}>Generated Image</Modal.Title>
              <Button 
                variant="primary" 
                size="sm"
                onClick={downloadImage}
                disabled={loading}
                style={{ marginRight: '40px' }} // Space for close button
              >
                {loading ? 'Downloading...' : '📥 Download HD'}
              </Button>
            </Modal.Header>
            <Modal.Body 
              style={{ 
                background: '#000', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '1rem',
                minHeight: 'calc(100vh - 60px)', // Account for header
                overflow: 'auto',
                position: 'relative'
              }}
            >
              <img 
                src={imageUrl} 
                alt="Large Generated" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain', 
                  borderRadius: 0, 
                  boxShadow: 'none',
                  margin: 'auto',
                  display: 'block',
                  cursor: 'pointer'
                }} 
                onClick={() => setShowModal(false)}
              />
              <div 
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: 'white',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  pointerEvents: 'none'
                }}
              >
                <div>{isMobile ? 'Tap image to close' : 'Click image to close'}</div>
                {!isMobile && (
                  <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.8 }}>
                    Press Ctrl+S to download
                  </div>
                )}
              </div>
            </Modal.Body>
          </Modal>
        </div>
      )}
      {/* Textbox for generated text below image control */}
      {generatedText && (
        <div style={{ marginTop: '2rem' }}>
          <Form.Label>Generated Text</Form.Label>
          <Form.Control
            as="textarea"
            value={generatedText}
            readOnly
            rows={6}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '1rem', background: '#f4f4f4', borderRadius: 8, border: '1px solid #ccc', padding: 8 }}
          />
        </div>
      )}
    </div>
  );
};

export default TestApiPage;
