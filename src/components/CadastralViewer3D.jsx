import React, { useState, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Grid, 
  Edges, 
  ContactShadows,
  Float
} from '@react-three/drei';
import * as THREE from 'three';
import { 
  Building2, 
  Layers, 
  CheckCircle2, 
  MapPin, 
  Box, 
  Split,
  Eye
} from 'lucide-react';

const DEFAULT_PROPERTY_DATA = {
  propertyId: "P0001",
  state: "KA",
  district: "MNG",
  groundElevationMSL: 15.0,
  floorHeight: 3.2,
  buildingFootprint: { width: 16, depth: 12 },
  floors: [
    {
      levelCode: "B01",
      floorNumber: -1,
      name: "Basement Level 1",
      isBasement: true,
      units: [
        {
          ulpin: "KA-MNG-P0001-B01-B01-U01",
          unitId: "U01",
          name: "Subsurface Parking & Utilities",
          area: 1600,
          relX: 0,
          relZ: 0,
          width: 15.2,
          depth: 11.2,
        }
      ]
    },
    {
      levelCode: "F00",
      floorNumber: 0,
      name: "Ground Floor (Lobby)",
      isBasement: false,
      units: [
        {
          ulpin: "KA-MNG-P0001-B01-F00-U01",
          unitId: "U01",
          name: "Reception & Commercial Bank",
          area: 750,
          relX: -3.8,
          relZ: 0,
          width: 7.4,
          depth: 11.2,
        },
        {
          ulpin: "KA-MNG-P0001-B01-F00-U02",
          unitId: "U02",
          name: "Retail Showroom & Cafe",
          area: 750,
          relX: 3.8,
          relZ: 0,
          width: 7.4,
          depth: 11.2,
        }
      ]
    },
    {
      levelCode: "F01",
      floorNumber: 1,
      name: "First Floor",
      isBasement: false,
      units: [
        {
          ulpin: "KA-MNG-P0001-B01-F01-U01",
          unitId: "U01",
          name: "Corporate Suite North",
          area: 750,
          relX: -3.8,
          relZ: 0,
          width: 7.4,
          depth: 11.2,
        },
        {
          ulpin: "KA-MNG-P0001-B01-F01-U02",
          unitId: "U02",
          name: "Corporate Suite South",
          area: 750,
          relX: 3.8,
          relZ: 0,
          width: 7.4,
          depth: 11.2,
        }
      ]
    },
    {
      levelCode: "F02",
      floorNumber: 2,
      name: "Second Floor",
      isBasement: false,
      units: [
        {
          ulpin: "KA-MNG-P0001-B01-F02-U01",
          unitId: "U01",
          name: "IT Workstation Unit A",
          area: 500,
          relX: -5.0,
          relZ: 0,
          width: 5.0,
          depth: 11.2,
        },
        {
          ulpin: "KA-MNG-P0001-B01-F02-U02",
          unitId: "U02",
          name: "IT Workstation Unit B",
          area: 500,
          relX: 0,
          relZ: 0,
          width: 4.8,
          depth: 11.2,
        },
        {
          ulpin: "KA-MNG-P0001-B01-F02-U03",
          unitId: "U03",
          name: "IT Workstation Unit C",
          area: 500,
          relX: 5.0,
          relZ: 0,
          width: 5.0,
          depth: 11.2,
        }
      ]
    },
    {
      levelCode: "F03",
      floorNumber: 3,
      name: "Third Floor (Penthouse)",
      isBasement: false,
      units: [
        {
          ulpin: "KA-MNG-P0001-B01-F03-U01",
          unitId: "U01",
          name: "Executive Penthouse 301",
          area: 750,
          relX: -3.8,
          relZ: 0,
          width: 7.4,
          depth: 11.2,
        },
        {
          ulpin: "KA-MNG-P0001-B01-F03-U02",
          unitId: "U02",
          name: "Executive Penthouse 302",
          area: 750,
          relX: 3.8,
          relZ: 0,
          width: 7.4,
          depth: 11.2,
        }
      ]
    }
  ]
};

// Structural Floor Concrete Slab + Edge Beam
const ConcreteFloorSlab = ({ yPos, width, depth, isRoof = false }) => (
  <group position={[0, yPos, 0]}>
    <mesh receiveShadow castShadow>
      <boxGeometry args={[width + 0.5, 0.25, depth + 0.5]} />
      <meshStandardMaterial 
        color="#1E293B" 
        roughness={0.7} 
        metalness={0.2} 
      />
      <Edges color="#475569" threshold={20} />
    </mesh>
    {/* Floor perimeter trim / fascia */}
    <mesh position={[0, -0.05, 0]}>
      <boxGeometry args={[width + 0.55, 0.1, depth + 0.55]} />
      <meshStandardMaterial color="#0F172A" />
    </mesh>
  </group>
);

// Architectural Column
const ConcreteColumn = ({ x, y, z, height }) => (
  <mesh position={[x, y + height / 2, z]} castShadow>
    <boxGeometry args={[0.45, height, 0.45]} />
    <meshStandardMaterial color="#334155" roughness={0.6} />
    <Edges color="#64748B" />
  </mesh>
);

// Window Mullion Dividers on Glass Facade
const WindowMullions = ({ width, height, depth }) => {
  const halfW = width / 2;
  const halfD = depth / 2;
  return (
    <group>
      {/* Front/Back Mullions */}
      {[-halfW * 0.5, 0, halfW * 0.5].map((mx, idx) => (
        <group key={`m-fb-${idx}`}>
          <mesh position={[mx, 0, halfD]}>
            <boxGeometry args={[0.06, height, 0.06]} />
            <meshStandardMaterial color="#0284C7" metalness={0.8} />
          </mesh>
          <mesh position={[mx, 0, -halfD]}>
            <boxGeometry args={[0.06, height, 0.06]} />
            <meshStandardMaterial color="#0284C7" metalness={0.8} />
          </mesh>
        </group>
      ))}
      {/* Side Mullions */}
      {[-halfD * 0.5, 0, halfD * 0.5].map((mz, idx) => (
        <group key={`m-side-${idx}`}>
          <mesh position={[halfW, 0, mz]}>
            <boxGeometry args={[0.06, height, 0.06]} />
            <meshStandardMaterial color="#0284C7" metalness={0.8} />
          </mesh>
          <mesh position={[-halfW, 0, mz]}>
            <boxGeometry args={[0.06, height, 0.06]} />
            <meshStandardMaterial color="#0284C7" metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// 3D Unit (Architectural Glass Parcel with Real Window Geometry)
const CadastralUnitMesh = ({
  unit,
  floor,
  floorHeight,
  elevationY,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}) => {
  const meshRef = useRef();
  const slabThickness = 0.25;
  const unitUsableHeight = floorHeight - slabThickness;
  const centerY = elevationY + unitUsableHeight / 2 + (slabThickness / 2);

  const halfW = unit.width / 2;
  const halfD = unit.depth / 2;

  const glassMaterial = useMemo(() => {
    if (isSelected) {
      return {
        color: new THREE.Color("#06B6D4"),
        transparent: true,
        opacity: 0.85,
        roughness: 0.1,
        metalness: 0.4,
        emissive: new THREE.Color("#0891B2"),
        emissiveIntensity: 0.5,
      };
    }
    if (isHovered) {
      return {
        color: new THREE.Color("#38BDF8"),
        transparent: true,
        opacity: 0.70,
        roughness: 0.2,
        metalness: 0.2,
        emissive: new THREE.Color("#0284C7"),
        emissiveIntensity: 0.3,
      };
    }
    if (floor.isBasement) {
      return {
        color: new THREE.Color("#0F172A"),
        transparent: true,
        opacity: 0.75,
        roughness: 0.8,
        metalness: 0.3,
        emissive: new THREE.Color("#000000"),
        emissiveIntensity: 0.0,
      };
    }
    // High-spec Architectural Blue Glass Facade
    return {
      color: new THREE.Color("#0F294D"),
      transparent: true,
      opacity: 0.45,
      roughness: 0.05,
      metalness: 0.85,
      emissive: new THREE.Color("#0369A1"),
      emissiveIntensity: 0.08,
    };
  }, [isSelected, isHovered, floor.isBasement]);

  return (
    <group position={[unit.relX, centerY, unit.relZ]}>
      {/* Clickable Parcel Mesh */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect({ 
            ...unit, 
            floorMeta: floor, 
            zMin: floor.floorNumber * floorHeight, 
            zMax: (floor.floorNumber + 1) * floorHeight 
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(unit.ulpin);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
        }}
      >
        <boxGeometry args={[unit.width, unitUsableHeight, unit.depth]} />
        <meshStandardMaterial {...glassMaterial} />
        
        {/* Wireframe outlines */}
        <Edges
          threshold={20}
          color={
            isSelected 
              ? "#FFFFFF" 
              : isHovered 
              ? "#67E8F9" 
              : floor.isBasement 
              ? "#475569" 
              : "#0284C7"
          }
          lineWidth={isSelected ? 3 : 1.5}
        />
      </mesh>

      {/* Real Window Mullions on Units */}
      {!floor.isBasement && (
        <WindowMullions width={unit.width} height={unitUsableHeight} depth={unit.depth} />
      )}

      {/* 4 Corner Concrete Columns per unit */}
      <ConcreteColumn x={-halfW + 0.25} y={-unitUsableHeight / 2} z={-halfD + 0.25} height={unitUsableHeight} />
      <ConcreteColumn x={halfW - 0.25} y={-unitUsableHeight / 2} z={-halfD + 0.25} height={unitUsableHeight} />
      <ConcreteColumn x={-halfW + 0.25} y={-unitUsableHeight / 2} z={halfD - 0.25} height={unitUsableHeight} />
      <ConcreteColumn x={halfW - 0.25} y={-unitUsableHeight / 2} z={halfD - 0.25} height={unitUsableHeight} />
    </group>
  );
};

// Rooftop Elevator Core, HVAC Plant & Parapet Railings
const RooftopStructure = ({ yPos, width, depth }) => (
  <group position={[0, yPos, 0]}>
    {/* Elevator Penthouse Machine Room */}
    <mesh position={[0, 1.25, 0]} castShadow>
      <boxGeometry args={[4.5, 2.5, 4.0]} />
      <meshStandardMaterial color="#1E293B" roughness={0.8} />
      <Edges color="#0284C7" />
    </mesh>

    {/* HVAC Units on Roof */}
    {[-3, 3].map((hx, idx) => (
      <mesh key={`hvac-${idx}`} position={[hx, 0.6, 2]}>
        <boxGeometry args={[1.8, 1.2, 1.8]} />
        <meshStandardMaterial color="#334155" metalness={0.6} />
        <Edges color="#64748B" />
      </mesh>
    ))}

    {/* Roof Perimeter Safety Parapet Wall */}
    <mesh position={[0, 0.45, depth / 2]}>
      <boxGeometry args={[width + 0.4, 0.9, 0.15]} />
      <meshStandardMaterial color="#0F172A" />
      <Edges color="#38BDF8" />
    </mesh>
    <mesh position={[0, 0.45, -depth / 2]}>
      <boxGeometry args={[width + 0.4, 0.9, 0.15]} />
      <meshStandardMaterial color="#0F172A" />
      <Edges color="#38BDF8" />
    </mesh>
    <mesh position={[width / 2, 0.45, 0]}>
      <boxGeometry args={[0.15, 0.9, depth + 0.4]} />
      <meshStandardMaterial color="#0F172A" />
      <Edges color="#38BDF8" />
    </mesh>
    <mesh position={[-width / 2, 0.45, 0]}>
      <boxGeometry args={[0.15, 0.9, depth + 0.4]} />
      <meshStandardMaterial color="#0F172A" />
      <Edges color="#38BDF8" />
    </mesh>
  </group>
);

// Basement Foundation Retaining Walls
const BasementRetainingWalls = ({ width, depth, height }) => (
  <group position={[0, -height / 2, 0]}>
    {/* Concrete Foundation Box Pit */}
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[width + 1.2, height, depth + 1.2]} />
      <meshStandardMaterial 
        color="#030712" 
        wireframe={true} 
        transparent={true} 
        opacity={0.3} 
      />
    </mesh>
    {/* Earth Cut Markers */}
    <Edges color="#1E293B" />
  </group>
);

export default function CadastralViewer3D({ 
  propertyData = DEFAULT_PROPERTY_DATA,
  onUnitSelect,
}) {
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [hoveredUlpin, setHoveredUlpin] = useState(null);
  const [isExplodedView, setIsExplodedView] = useState(false);

  const handleUnitClick = (unitPayload) => {
    setSelectedParcel(unitPayload);
    if (onUnitSelect) onUnitSelect(unitPayload);
  };

  const totalBasementFloors = propertyData.floors.filter(f => f.isBasement).length;
  const basementDepthMeters = totalBasementFloors * propertyData.floorHeight;

  // Maximum roof height
  const topSuperFloor = propertyData.floors.filter(f => !f.isBasement).slice(-1)[0];
  const roofElevationY = (topSuperFloor.floorNumber + 1) * propertyData.floorHeight;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#020617', overflow: 'hidden' }}>
      
      {/* 3D Viewport */}
      <Canvas
        camera={{ position: [26, 20, 28], fov: 38 }}
        gl={{ antialias: true }}
        onPointerMissed={() => setSelectedParcel(null)}
      >
        <color attach="background" args={["#020617"]} />

        {/* Realistic Architectural Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[25, 45, 30]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
        />
        <directionalLight position={[-25, 15, -20]} intensity={0.4} color="#38BDF8" />
        <pointLight position={[0, -5, 0]} intensity={0.6} color="#0284C7" />

        {/* Survey Cadastral Ground Grid */}
        <Grid
          position={[0, 0, 0]}
          args={[70, 70]}
          cellSize={1}
          cellThickness={0.6}
          cellColor="#0F294D"
          sectionSize={5}
          sectionThickness={1.4}
          sectionColor="#0284C7"
          fadeDistance={55}
          fadeStrength={1.5}
        />

        {/* Basement Earth Pit */}
        {basementDepthMeters > 0 && (
          <BasementRetainingWalls 
            width={propertyData.buildingFootprint.width} 
            depth={propertyData.buildingFootprint.depth} 
            height={basementDepthMeters} 
          />
        )}

        {/* Complete Architectural Building Hierarchy */}
        <group>
          {propertyData.floors.map((floor) => {
            // Exploded view expands floors upwards for spatial inspection
            const explodeOffset = isExplodedView ? floor.floorNumber * 2.2 : 0;
            const floorBaseY = (floor.floorNumber * propertyData.floorHeight) + explodeOffset;

            return (
              <group key={floor.levelCode}>
                {/* Structural Concrete Slab */}
                <ConcreteFloorSlab 
                  yPos={floorBaseY} 
                  width={propertyData.buildingFootprint.width} 
                  depth={propertyData.buildingFootprint.depth} 
                />

                {/* Units on this floor */}
                {floor.units.map((unit) => (
                  <CadastralUnitMesh
                    key={unit.ulpin}
                    unit={unit}
                    floor={floor}
                    floorHeight={propertyData.floorHeight}
                    elevationY={floorBaseY}
                    isSelected={selectedParcel?.ulpin === unit.ulpin}
                    isHovered={hoveredUlpin === unit.ulpin}
                    onSelect={handleUnitClick}
                    onHover={setHoveredUlpin}
                  />
                ))}
              </group>
            );
          })}

          {/* Roof Slab & Elevator Penthouse */}
          <ConcreteFloorSlab 
            yPos={roofElevationY + (isExplodedView ? topSuperFloor.floorNumber * 2.2 : 0)} 
            width={propertyData.buildingFootprint.width} 
            depth={propertyData.buildingFootprint.depth} 
            isRoof={true}
          />
          <RooftopStructure 
            yPos={roofElevationY + (isExplodedView ? topSuperFloor.floorNumber * 2.2 : 0) + 0.25} 
            width={propertyData.buildingFootprint.width} 
            depth={propertyData.buildingFootprint.depth} 
          />
        </group>

        <ContactShadows position={[0, -0.01, 0]} opacity={0.7} scale={35} blur={2.0} far={15} color="#000000" />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={75}
          maxPolarAngle={Math.PI / 2 + 0.15}
        />
      </Canvas>

      {/* Top Left Header */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        backgroundColor: 'rgba(9, 13, 26, 0.88)',
        border: '1px solid #1E293B',
        padding: '14px 18px',
        borderRadius: '10px',
        color: '#FFFFFF',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 style={{ width: 22, height: 22, color: '#22D3EE' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            3D Spatial Cadastre
          </span>
          <span style={{ fontSize: '10px', backgroundColor: '#083344', color: '#67E8F9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #155E75', fontFamily: 'monospace' }}>
            ARCH-SPEC
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94A3B8', marginTop: '6px' }}>
          <MapPin style={{ width: 14, height: 14 }} />
          <span>Parcel: {propertyData.propertyId} ({propertyData.state}-{propertyData.district})</span>
          <span style={{ color: '#475569' }}>|</span>
          <span>Datum: {propertyData.groundElevationMSL.toFixed(1)}m MSL</span>
        </div>
      </div>

      {/* Exploded View Control Button */}
      <div style={{ position: 'absolute', top: 20, left: 320, zIndex: 10 }}>
        <button
          onClick={() => setIsExplodedView(!isExplodedView)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isExplodedView ? '#0891B2' : 'rgba(9, 13, 26, 0.88)',
            color: '#FFFFFF',
            border: `1px solid ${isExplodedView ? '#22D3EE' : '#1E293B'}`,
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Split style={{ width: 16, height: 16 }} />
          {isExplodedView ? "Collapse Building" : "Exploded Floor View"}
        </button>
      </div>

      {/* Navigation Help */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 10,
        fontSize: '11px',
        color: '#94A3B8',
        backgroundColor: 'rgba(9, 13, 26, 0.75)',
        border: '1px solid #1E293B',
        padding: '8px 14px',
        borderRadius: '8px',
        display: 'flex',
        gap: '14px'
      }}>
        <span>Rotate: <strong style={{ color: '#E2E8F0' }}>Left Click + Drag</strong></span>
        <span>Pan: <strong style={{ color: '#E2E8F0' }}>Right Click + Drag</strong></span>
        <span>Zoom: <strong style={{ color: '#E2E8F0' }}>Scroll</strong></span>
      </div>

      {/* Right-Hand Cadastral HUD Details Panel */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        width: '320px',
        backgroundColor: 'rgba(9, 13, 26, 0.94)',
        border: '1px solid #1E293B',
        borderRadius: '12px',
        padding: '20px',
        color: '#FFFFFF',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {selectedParcel ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
              <span style={{ fontSize: '10px', color: '#22D3EE', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>
                Unit Parcel Spatial Identity
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F1F5F9', marginTop: '4px', margin: 0 }}>
                {selectedParcel.unitId} — {selectedParcel.name}
              </h3>
            </div>

            {/* ULPIN Block */}
            <div style={{ backgroundColor: '#030712', border: '1px solid rgba(22, 78, 99, 0.5)', borderRadius: '8px', padding: '10px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94A3B8', display: 'block', fontFamily: 'monospace' }}>
                Unique 3D ULPIN
              </span>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold', color: '#67E8F9', wordBreak: 'break-all' }}>
                {selectedParcel.ulpin}
              </span>
            </div>

            {/* Spatial Matrix Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
              <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', border: '1px solid #1E293B', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '10px' }}>Level Tier</span>
                <span style={{ fontWeight: 600, color: '#E2E8F0' }}>{selectedParcel.floorMeta.name}</span>
              </div>
              <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', border: '1px solid #1E293B', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '10px' }}>Carpet Area</span>
                <span style={{ fontWeight: 600, color: '#E2E8F0' }}>{selectedParcel.area} sq.ft</span>
              </div>
              <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', border: '1px solid #1E293B', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '10px' }}>Vertical Slice (Z)</span>
                <span style={{ fontWeight: 600, color: '#67E8F9', fontFamily: 'monospace' }}>
                  {selectedParcel.zMin.toFixed(1)}m → {selectedParcel.zMax.toFixed(1)}m
                </span>
              </div>
              <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', border: '1px solid #1E293B', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '10px' }}>Absolute MSL</span>
                <span style={{ fontWeight: 600, color: '#67E8F9', fontFamily: 'monospace' }}>
                  {(propertyData.groundElevationMSL + selectedParcel.zMin).toFixed(1)}m
                </span>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#94A3B8', borderTop: '1px solid #1E293B', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Classification:</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'monospace',
                backgroundColor: selectedParcel.floorMeta.isBasement ? 'rgba(69, 26, 3, 0.6)' : 'rgba(2, 44, 34, 0.6)',
                color: selectedParcel.floorMeta.isBasement ? '#FCD34D' : '#6EE7B7',
                border: selectedParcel.floorMeta.isBasement ? '1px solid rgba(146, 64, 14, 0.6)' : '1px solid rgba(6, 95, 70, 0.6)'
              }}>
                {selectedParcel.floorMeta.isBasement ? 'Subterranean Parcel' : 'Superstructure Parcel'}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ padding: '36px 0', textAlign: 'center' }}>
            <Box style={{ width: 42, height: 42, color: '#475569', margin: '0 auto 10px auto' }} />
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#CBD5E1', margin: 0 }}>Select a Property Parcel</p>
            <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
              Click any 3D unit or floor in the building to view its cadastral boundary, height interval, and ULPIN.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}