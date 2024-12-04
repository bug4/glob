import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useMemo, useState, useEffect } from 'react';
import { collection, addDoc, orderBy, query, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function SpaceField({ count = 200, color }) {
  const points = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const radius = 4 + Math.random() * 10;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      temp.push(new THREE.Vector3(x, y, z));
    }
    return temp;
  }, [count]);

  const pointsRef = useRef();

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0003;
    }
  });

  const pointsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  return (
    <group ref={pointsRef}>
      <points geometry={pointsGeometry}>
        <pointsMaterial
          color={color || "#00ff00"}
          size={0.05}
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

function GridSphere({ radius = 2, detail = 24, color }) {
  const points = useMemo(() => {
    const points = [];
    for (let i = 0; i < detail/2; i++) {
      const lat = (i / (detail/2)) * Math.PI;
      for (let j = 0; j <= detail; j++) {
        const long = (j / detail) * 2 * Math.PI;
        const x = radius * Math.sin(lat) * Math.cos(long);
        const y = radius * Math.cos(lat);
        const z = radius * Math.sin(lat) * Math.sin(long);
        points.push(new THREE.Vector3(x, y, z));
      }
    }
    for (let i = 0; i < detail/2; i++) {
      const long = (i / (detail/2)) * 2 * Math.PI;
      for (let j = 0; j <= detail; j++) {
        const lat = (j / detail) * Math.PI;
        const x = radius * Math.sin(lat) * Math.cos(long);
        const y = radius * Math.cos(lat);
        const z = radius * Math.sin(lat) * Math.sin(long);
        points.push(new THREE.Vector3(x, y, z));
      }
    }
    return points;
  }, [radius, detail]);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color={color || "#00ff00"} transparent opacity={0.3} />
    </line>
  );
}

function GlobeGeometry() {
  const groupRef = useRef();
  const [color, setColor] = useState("#00ff00");

  useEffect(() => {
    const flickerInterval = setInterval(() => {
      setColor("#ff0000");
      setTimeout(() => {
        setColor("#00ff00");
      }, 200);
    }, 30000);

    return () => clearInterval(flickerInterval);
  }, []);

  useFrame(() => {
    groupRef.current.rotation.y += 0.001;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial 
          color={color}
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      <GridSphere color={color} />

      {Array.from({ length: 30 }).map((_, i) => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const x = 2 * Math.sin(phi) * Math.cos(theta);
        const y = 2 * Math.sin(phi) * Math.sin(theta);
        const z = 2 * Math.cos(phi);
        return (
          <mesh key={i} position={[x, y, z]} scale={[0.02, 0.02, 0.02]}>
            <sphereGeometry args={[1, 4, 4]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

const MatrixChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageList);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (tempUsername.trim()) {
      setUsername(tempUsername);
      setShowUsernamePrompt(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        username,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black border border-[#00ff00] text-[#00ff00] px-4 py-2 mb-2 
                 hover:bg-[#00ff00] hover:text-black transition-all duration-300 font-mono"
      >
        {isOpen ? 'Close Chat' : 'Open Chat'}
      </button>

      {isOpen && (
        <div className="w-80 h-96 bg-black border border-[#00ff00] flex flex-col font-mono">
          {!username ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <form onSubmit={handleUsernameSubmit} className="w-full space-y-4">
                <div className="text-[#00ff00] text-center mb-4">Enter Your Username</div>
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  className="w-full bg-black border border-[#00ff00] text-[#00ff00] p-2 
                           focus:outline-none focus:border-[#00ff00]"
                  placeholder="Username..."
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full bg-[#00ff00] text-black py-2 hover:bg-[#00ff00]/80 
                           transition-colors duration-300"
                >
                  Begin Chat
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`text-[#00ff00] ${
                      msg.username === username ? 'text-right' : 'text-left'
                    }`}
                  >
                    <span className="text-xs opacity-80">{msg.username}:</span>
                    <div className="bg-[#00ff00]/10 p-2 rounded inline-block">
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-2 border-t border-[#00ff00]">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full bg-black border border-[#00ff00] text-[#00ff00] p-2 
                           focus:outline-none focus:border-[#00ff00]"
                  placeholder="Type a message..."
                />
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const LoadingScreen = ({ onStart }) => {
  const clickSound = useMemo(() => new Audio('/click.mp3'), []);

  const handleClick = () => {
    clickSound.play();
    onStart();
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="text-[#00ff00] text-4xl mb-8 font-mono animate-pulse">
        System Loading...
      </div>
      <button
        onClick={handleClick}
        className="px-8 py-3 bg-transparent border-2 border-[#00ff00] text-[#00ff00] 
                 hover:bg-[#00ff00] hover:text-black transition-all duration-300 
                 font-mono text-xl relative overflow-hidden group"
      >
        <span className="relative z-10">GET STARTED</span>
        <div className="absolute inset-0 bg-[#00ff00] transform scale-x-0 group-hover:scale-x-100 
                      transition-transform origin-left duration-300"></div>
      </button>
    </div>
  );
}

const MatrixGlobe = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const audioRef = useRef(new Audio('/music.mp3'));

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };
  }, []);

  const handleStart = () => {
    audioRef.current.play();
    audioRef.current.loop = true;
    setIsReady(true);
  };

  if (isLoading || !isReady) {
    return <LoadingScreen onStart={handleStart} />;
  }

  return (
    <div className="h-screen w-full bg-black">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000000']} />
        
        <GlobeGeometry />
        <SpaceField count={300} />
        
        <OrbitControls
          enableZoom={true}
          zoomSpeed={1.0}
          minDistance={8}
          maxDistance={12}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI - Math.PI / 4}
          rotateSpeed={0.5}
        />
      </Canvas>
      <MatrixChat />
    </div>
  );
}

export default MatrixGlobe;