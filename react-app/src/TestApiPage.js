import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { BiLogoBlogger } from 'react-icons/bi';
import Modal from 'react-bootstrap/Modal';
//import { usePollinationsImage } from '@pollinations/react';
const TestApiPage = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [croppedDataUrl, setCroppedDataUrl] = useState('');
  const [generatedText, setGeneratedText] = useState('');

  async function handleTestApi() {
    setLoading(true);
    setError(null);
    setImageUrl('');
    try {
      // Use GET method for Pollinations.ai image generation
      const encodedPrompt = encodeURIComponent(prompt);
      const imageApiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=nanobanana`;
      // Optionally, you can check if the image exists by fetching the URL
      setImageUrl(imageApiUrl);
    } catch (err) {
      setError('Error generating image: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  }

  // Gemini API image generation function
  async function handleGeminiApi() {
    setLoading(true);
    setError(null);
    setImageUrl('');
    setCroppedDataUrl('');
    try {
      // Example Gemini API endpoint and prompt usage
      // Replace with your actual Gemini API endpoint and authentication if needed
      const response = await fetch('https://api.gemini.com/v1/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
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

  async function handleTestTextPrompt() {
    setLoading(true);
    setError(null);
    setGeneratedText('');
    try {
      // Example Pollinations text generation API endpoint
      // Replace with the actual endpoint if different
      const encodedPrompt = encodeURIComponent(prompt);
      const response = await fetch(`https://text.pollinations.ai/${encodedPrompt}?model=openai`);
      if (!response.ok) throw new Error('API request failed');
      const text = await response.text();
      setGeneratedText(text);
    } catch (err) {
      setError('Network or Text API error: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24, background: '#fafafa', borderRadius: 12, boxShadow: '0 2px 8px rgba(33,150,243,0.07)' }}>
      <h3 style={{ textAlign: 'center', color: '#1976d2', fontWeight: 700 }}>Test Pollinations.ai Image Generation</h3>
      <Form.Group className="mb-3">
        <Form.Label>Prompt (multiline)</Form.Label>
        <Form.Control
          as="textarea"
          rows={6}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          style={{ fontFamily: 'monospace', fontSize: '1rem', background: '#f4f4f4', borderRadius: 8, border: '1px solid #ccc', padding: 8 }}
        />
      </Form.Group>
      <Button variant="primary" onClick={handleTestApi} disabled={loading} style={{ minWidth: 120, fontWeight: 600, marginRight: 12 }}>
        {loading ? 'Generating...' : 'Test Pollinations'}
      </Button>
      <Button variant="info" onClick={handleGeminiApi} disabled={loading} style={{ minWidth: 120, fontWeight: 600, marginRight: 12 }}>
        {loading ? 'Generating...' : 'Test Gemini'}
      </Button>
      <Button variant="success" onClick={handleTestTextPrompt} disabled={loading} style={{ minWidth: 120, fontWeight: 600 }}>
        {loading ? 'Generating...' : 'TestTextPrompt'}
      </Button>
      {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
      {imageUrl && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <img
            src={imageUrl}
            alt="Generated"
            style={{ width: '100%', height: '400px', objectFit: 'contain', borderRadius: 8, boxShadow: '0 2px 8px rgba(33,150,243,0.10)', cursor: 'pointer' }}
            onDoubleClick={() => setShowModal(true)}
          />
          <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl" backdrop="static" dialogClassName="fullscreen-modal">
            <Modal.Header closeButton style={{ background: '#e3f2fd', borderBottom: '1px solid #1976d2' }}>
              <Modal.Title style={{ fontWeight: 700, color: '#1976d2' }}>Generated Image</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ background: '#fafafa', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: 0 }}>
              <img src={imageUrl} alt="Large Generated" style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain', borderRadius: 0, boxShadow: 'none', margin: 'auto' }} />
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
