import React from 'react';

// Simple debug component to test if React is rendering
const DebugHome = () => {
  console.log('🚀 DEBUG: DebugHome component is rendering');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🔍 Debug Home Page</h1>
      <p style={{ color: '#666', fontSize: '18px' }}>
        If you can see this message, React is working correctly.
      </p>
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e8f5e8', 
        border: '1px solid #4CAF50',
        borderRadius: '5px'
      }}>
        <strong>✅ React App Status:</strong>
        <ul>
          <li>Component rendered successfully</li>
          <li>Routing is working</li>
          <li>JavaScript is executing</li>
        </ul>
      </div>
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffc107',
        borderRadius: '5px'
      }}>
        <strong>⚡ Next Steps:</strong>
        <ol>
          <li>Check browser console for errors</li>
          <li>Verify all imports are correct</li>
          <li>Test individual components</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugHome;