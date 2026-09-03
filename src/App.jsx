import React from 'react';
import CadastralViewer3D from './components/CadastralViewer3D';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#020617', margin: 0, padding: 0 }}>
      <header style={{ 
        height: '48px', 
        borderBottom: '1px solid #1E293B', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        backgroundColor: '#090D1A', 
        color: '#FFFFFF' 
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>
          BHUNAKSHA 3D • VERTICAL PROPERTY MAPPING SYSTEM
        </span>
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#22D3EE' }}>
          ENGINE STATUS: ONLINE
        </span>
      </header>
      
      <main style={{ flex: 1, position: 'relative' }}>
        <CadastralViewer3D />
      </main>
    </div>
  );
}