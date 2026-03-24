import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f3f4f6', color: '#3B2213', padding: '20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px' }}>Oops! Something went wrong.</h1>
          <p style={{ marginBottom: '20px', fontWeight: '500' }}>The app encountered an unexpected error. Don't worry, your offline data is safe.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '12px 24px', backgroundColor: '#3B2213', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Refresh App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;