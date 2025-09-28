import React from 'react';

function Login() {
  return (
    <div className="construction-login">
      <h2>Login</h2>
      <form className="login-form">
        <div className="login-form-row">
          <label>
            Username:
            <input type="text" name="username" />
          </label>
          <label>
            Password:
            <input type="password" name="password" />
          </label>
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
