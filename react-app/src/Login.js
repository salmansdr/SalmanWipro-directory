import React from 'react';

function Login() {
  return (
    <div className="construction-login">
      <h2>Login</h2>
      <form className="login-form">
        <div className="login-form-row">
          <div className="login-field-group">
            <label className="login-label" htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" className="modern-input" autoComplete="username" />
          </div>
          <div className="login-field-group">
            <label className="login-label" htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" className="modern-input" autoComplete="current-password" />
          </div>
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
