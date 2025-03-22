import { useState } from 'react'
import styles from './ProfileEdit.module.css' // Reusing the same styles
import { tr } from '@/translation/Translation'
import First from "./1.png"
import Second from "./2.png"
import Third from "./3.png"

interface PathAvoidanceEditProps {
    onClose: () => void
}

// Stairs data with random Potsdam addresses and avoidance counts
const stairsData = [
    { id: 1, address: "Am Neuen Palais 10, Potsdam", avoidanceCount: 237, description: "", image: First },
    { id: 2, address: "Brandenstraße 45, Potsdam", avoidanceCount: 196, description: "", image: Second },
    { id: 3, address: "Luisenplatz 5, Potsdam", avoidanceCount: 182, description: "", image: Third },
    { id: 4, address: "Charlottenstraße 31, Potsdam", avoidanceCount: 167, description: "Historic district residential stairs" },
    { id: 5, address: "Allee nach Sanssouci 6, Potsdam", avoidanceCount: 154, description: "Palace garden terraced stairs" },
    { id: 6, address: "Bassinplatz 3, Potsdam", avoidanceCount: 134, description: "City center transit station" },
    { id: 7, address: "Hegelallee 21, Potsdam", avoidanceCount: 121, description: "University library entrance" },
    { id: 8, address: "Friedrich-Ebert-Straße 83, Potsdam", avoidanceCount: 118, description: "Residential complex access" },
    { id: 9, address: "Schopenhauerstraße 15, Potsdam", avoidanceCount: 105, description: "Hospital entrance stairs" },
    { id: 10, address: "Rudolf-Breitscheid-Straße 37, Potsdam", avoidanceCount: 89, description: "Shopping mall rear entrance" }
];

export default function PathAvoidanceEdit({ onClose }: PathAvoidanceEditProps) {
    const [selectedStairs, setSelectedStairs] = useState<number | null>(null);

    const handleStairsClick = (id: number) => {
        setSelectedStairs(id === selectedStairs ? null : id);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{tr('Stairs Avoidance Rankings')}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div style={{ padding: '20px' }}>
                    <p style={{ marginBottom: '20px' }}>
                        These are the most frequently avoided stairs in your area. The ranking is based on how many times users have chosen routes that avoid these locations.
                    </p>

                    {/* Top 3 Entries with Pictures - Vertical Stack */}
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ marginBottom: '15px' }}>Top 3 Most Avoided Stairs</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {stairsData.slice(0, 3).map((stairs) => (
                                <div 
                                    key={stairs.id} 
                                    style={{ 
                                        width: '100%',
                                        backgroundColor: selectedStairs === stairs.id ? '#f0f7ff' : 'white',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        transform: selectedStairs === stairs.id ? 'scale(1.01)' : 'scale(1)',
                                        display: 'flex',
                                        flexDirection: 'row'
                                    }}
                                    onClick={() => handleStairsClick(stairs.id)}
                                >
                                    <div style={{ 
                                        position: 'relative',
                                        width: '180px',
                                        flexShrink: 0
                                    }}>
                                        <img 
                                            src={stairs.image} 
                                            alt={`Stairs at ${stairs.address}`} 
                                            style={{ 
                                                width: '100%', 
                                                height: '120px', 
                                                objectFit: 'cover' 
                                            }} 
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            left: '10px',
                                            backgroundColor: '#4a89dc',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '28px',
                                            height: '28px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }}>
                                            #{stairs.id}
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px', flex: 1 }}>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{stairs.address}</h4>
                                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                                            {stairs.description}
                                        </p>
                                        <div style={{ 
                                            fontWeight: 'bold', 
                                            color: '#4a89dc',
                                            fontSize: '18px' 
                                        }}>
                                            {stairs.avoidanceCount} times avoided
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Other Entries in Compact List */}
                    <div style={{ marginBottom: '20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ 
                                    borderBottom: '1px solid #ddd',
                                    fontWeight: 'bold',
                                    textAlign: 'left',
                                    color: '#555'
                                }}>
                                    <th style={{ padding: '8px 5px' }}>Rank</th>
                                    <th style={{ padding: '8px 5px' }}>Location</th>
                                    <th style={{ padding: '8px 5px', textAlign: 'right' }}>Times Avoided</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stairsData.slice(3).map((stairs, index) => (
                                    <tr 
                                        key={stairs.id}
                                        style={{ 
                                            borderBottom: '1px solid #eee',
                                            backgroundColor: selectedStairs === stairs.id ? '#f5f5f5' : 'transparent',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleStairsClick(stairs.id)}
                                    >
                                        <td style={{ padding: '8px 5px' }}>{index + 4}</td>
                                        <td style={{ padding: '8px 5px' }}>{stairs.address}</td>
                                        <td style={{ padding: '8px 5px', textAlign: 'right', fontWeight: 'bold', color: '#4a89dc' }}>
                                            {stairs.avoidanceCount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Details Panel for Selected Stairs */}
                    {selectedStairs && (
                        <div style={{
                            padding: '15px',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '5px',
                            marginBottom: '20px',
                            border: '1px solid #eee'
                        }}>
                            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>
                                Details for Selected Location
                            </h3>
                            
                            {/* Show image for the selected stairs if it's in the top 3 */}
                            {selectedStairs <= 3 && (
                                <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                                    <img 
                                        src={stairsData.find(s => s.id === selectedStairs)?.image} 
                                        alt="Selected stairs"
                                        style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '200px', 
                                            borderRadius: '4px',
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>
                            )}
                            
                            <p>
                                <strong>Address:</strong> {stairsData.find(s => s.id === selectedStairs)?.address}
                            </p>
                            <p>
                                <strong>Description:</strong> {stairsData.find(s => s.id === selectedStairs)?.description}
                            </p>
                            <p>
                                <strong>Avoidance Rate:</strong> {stairsData.find(s => s.id === selectedStairs)?.avoidanceCount} times
                            </p>
                        </div>
                    )}

                    <div className={styles.actions} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button 
                            className={styles.cancelButton} 
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            {tr('Close')}
                        </button>
                        <button 
                            style={{
                                backgroundColor: '#4a89dc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {tr('View on Map')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 