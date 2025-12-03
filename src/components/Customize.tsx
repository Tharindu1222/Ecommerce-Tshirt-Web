import { useState, useRef, Suspense, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, PerspectiveCamera } from '@react-three/drei';
import { ArrowLeft, Upload, X, RotateCcw, Grid, ZoomIn, ZoomOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { Navbar } from './Navbar';
import { Cart } from './Cart';
import { Login } from './Login';
import { Register } from './Register';
import { UserProfile } from './UserProfile';

// 3D T-shirt Model Component
function ShirtModel({ 
  color, 
  designs, 
  uploadedImages 
}: { 
  color: string; 
  designs: Record<string, Array<{ id: string; imageId: string; x: number; y: number; width: number; height: number; rotation: number }>>;
  uploadedImages: Array<{ id: string; url: string; name: string }>;
}) {
  const { scene } = useGLTF('/shirt.glb');
  const meshRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  // Get image URL by ID
  const getImageUrl = (imageId: string) => {
    return uploadedImages.find((img) => img.id === imageId)?.url || '';
  };

  // Create canvas for texture
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 1024;
      canvasRef.current.height = 1024;
      
      // Create texture from canvas
      if (canvasRef.current && !textureRef.current) {
        const tex = new THREE.CanvasTexture(canvasRef.current);
        tex.flipY = false;
        textureRef.current = tex;
      }
    }
  }, []);

  // Update canvas with designs
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Fill with shirt color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw all images
    const loadAndDrawImages = async () => {
      // Clear and redraw base color
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw front designs (top half of texture)
      for (const design of designs.front) {
        const imgUrl = getImageUrl(design.imageId);
        if (!imgUrl) continue;

        try {
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = imgUrl;
          });

          const x = (design.x / 100) * canvas.width;
          const y = (design.y / 100) * (canvas.height / 2); // Front is top half
          const width = (design.width / 100) * canvas.width;
          const height = (design.height / 100) * (canvas.height / 2);

          ctx.save();
          ctx.translate(x + width / 2, y + height / 2);
          ctx.rotate((design.rotation * Math.PI) / 180);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          ctx.restore();
        } catch (err) {
          console.error('Error loading image:', err);
        }
      }

      // Draw back designs (bottom half of texture)
      for (const design of designs.back) {
        const imgUrl = getImageUrl(design.imageId);
        if (!imgUrl) continue;

        try {
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = imgUrl;
          });

          const x = (design.x / 100) * canvas.width;
          const y = (canvas.height / 2) + (design.y / 100) * (canvas.height / 2); // Back is bottom half
          const width = (design.width / 100) * canvas.width;
          const height = (design.height / 100) * (canvas.height / 2);

          ctx.save();
          ctx.translate(x + width / 2, y + height / 2);
          ctx.rotate((design.rotation * Math.PI) / 180);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          ctx.restore();
        } catch (err) {
          console.error('Error loading image:', err);
        }
      }

      // Update texture
      if (textureRef.current) {
        textureRef.current.needsUpdate = true;
      }
    };

    loadAndDrawImages();
  }, [color, designs, uploadedImages]);

  // Clone scene and extract materials
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const cloned = scene.clone();
    materialsRef.current = [];
    
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        // Handle both single material and array of materials
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            materialsRef.current.push(mat);
          }
        });
      }
    });
    
    return cloned;
  }, [scene]);

  // Update material with color and texture
  useEffect(() => {
    if (materialsRef.current.length > 0) {
      const colorObj = new THREE.Color(color);
      materialsRef.current.forEach((material) => {
        material.color.copy(colorObj);
        if (textureRef.current) {
          material.map = textureRef.current;
        }
        material.needsUpdate = true;
      });
    }
  }, [color, designs]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  if (!clonedScene) return null;

  return <primitive ref={meshRef} object={clonedScene} scale={1} />;
}

// Main Customize Component
export const Customize = () => {
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [shirtColor, setShirtColor] = useState('#000000');
  const [designs, setDesigns] = useState<Record<string, Array<{ id: string; imageId: string; x: number; y: number; width: number; height: number; rotation: number }>>>({
    front: [],
    back: [],
    leftSleeve: [],
    rightSleeve: [],
  });
  const [activeView, setActiveView] = useState<'front' | 'back' | 'leftSleeve' | 'rightSleeve'>('front');
  const [zoom, setZoom] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [resizingDesign, setResizingDesign] = useState<{ view: typeof activeView; id: string } | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [draggingDesign, setDraggingDesign] = useState<{ view: typeof activeView; id: string } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; designX: number; designY: number; containerWidth: number; containerHeight: number } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        if (file.size > 10 * 1024 * 1024) {
          alert('File size must be less than 10MB');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          const newImage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            url,
            name: file.name,
          };
          setUploadedImages((prev) => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleImageClick = (imageId: string) => {
    setSelectedImage(imageId);
  };

  const handleTemplateClick = (e: React.MouseEvent<HTMLDivElement>, view: typeof activeView) => {
    if (!selectedImage) {
      alert('Please select an image first by clicking on it in the left sidebar');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newDesign = {
      id: Date.now().toString(),
      imageId: selectedImage,
      x: Math.max(0, Math.min(100, x - 10)),
      y: Math.max(0, Math.min(100, y - 10)),
      width: 20,
      height: 20,
      rotation: 0,
    };

    setDesigns((prev) => ({
      ...prev,
      [view]: [...prev[view], newDesign],
    }));
  };

  const removeDesign = (view: typeof activeView, designId: string) => {
    setDesigns((prev) => ({
      ...prev,
      [view]: prev[view].filter((d) => d.id !== designId),
    }));
  };

  const removeImage = (imageId: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
    // Remove designs using this image
    Object.keys(designs).forEach((view) => {
      setDesigns((prev) => ({
        ...prev,
        [view]: prev[view as keyof typeof prev].filter((d) => d.imageId !== imageId),
      }));
    });
    if (selectedImage === imageId) {
      setSelectedImage(null);
    }
  };

  const getImageUrl = (imageId: string) => {
    return uploadedImages.find((img) => img.id === imageId)?.url || '';
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShirtColor(e.target.value);
  };

  const handleResizeStart = (e: React.MouseEvent, view: typeof activeView, designId: string) => {
    e.stopPropagation();
    const design = designs[view].find((d) => d.id === designId);
    if (!design) return;

    setResizingDesign({ view, id: designId });
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: design.width,
      height: design.height,
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingDesign || !resizeStart) return;

    // Calculate size change based on mouse movement
    // Use a scale factor to make resizing feel natural
    const scaleFactor = 0.5; // Adjust this to make resizing faster/slower
    const deltaX = ((e.clientX - resizeStart.x) / window.innerWidth) * 100 * scaleFactor;
    const deltaY = ((e.clientY - resizeStart.y) / window.innerHeight) * 100 * scaleFactor;

    const newWidth = Math.max(5, Math.min(80, resizeStart.width + deltaX));
    const newHeight = Math.max(5, Math.min(80, resizeStart.height + deltaY));

    setDesigns((prev) => ({
      ...prev,
      [resizingDesign.view]: prev[resizingDesign.view].map((d) =>
        d.id === resizingDesign.id ? { ...d, width: newWidth, height: newHeight } : d
      ),
    }));
  };

  const handleResizeEnd = () => {
    setResizingDesign(null);
    setResizeStart(null);
  };

  const handleDragStart = (e: React.MouseEvent, view: typeof activeView, designId: string) => {
    e.stopPropagation();
    // Don't start dragging if clicking on resize handle or delete button
    const target = e.target as HTMLElement;
    if (target.closest('.resize-handle') || target.closest('button')) {
      return;
    }

    const design = designs[view].find((d) => d.id === designId);
    if (!design) return;

    const templateContainer = (e.currentTarget as HTMLElement).closest('.template-container');
    if (!templateContainer) return;

    const rect = templateContainer.getBoundingClientRect();
    setDraggingDesign({ view, id: designId });
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      designX: design.x,
      designY: design.y,
      containerWidth: rect.width,
      containerHeight: rect.height,
    });
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!draggingDesign || !dragStart) return;

    // Use the stored container dimensions
    const deltaX = ((e.clientX - dragStart.x) / dragStart.containerWidth) * 100;
    const deltaY = ((e.clientY - dragStart.y) / dragStart.containerHeight) * 100;

    const newX = Math.max(0, Math.min(100, dragStart.designX + deltaX));
    const newY = Math.max(0, Math.min(100, dragStart.designY + deltaY));

    setDesigns((prev) => ({
      ...prev,
      [draggingDesign.view]: prev[draggingDesign.view].map((d) =>
        d.id === draggingDesign.id ? { ...d, x: newX, y: newY } : d
      ),
    }));
  };

  const handleDragEnd = () => {
    setDraggingDesign(null);
    setDragStart(null);
  };

  // Add global mouse event listeners for resizing
  useEffect(() => {
    if (resizingDesign && resizeStart) {
      const handleMove = (e: MouseEvent) => handleResizeMove(e);
      const handleEnd = () => handleResizeEnd();
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
      };
    }
  }, [resizingDesign, resizeStart]);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (draggingDesign && dragStart) {
      const handleMove = (e: MouseEvent) => handleDragMove(e);
      const handleEnd = () => handleDragEnd();
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
      };
    }
  }, [draggingDesign, dragStart]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar
        onCartClick={() => setIsCartOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)}
      />
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left Sidebar - Image Upload */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <Link
              to="/"
              className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Editor
            </Link>
            <h2 className="text-xl font-bold text-white">Upload and place images</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 px-6 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              Add Images ↑
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-400 text-center">PNG or JPG (max. 10MB)</p>

            {selectedImage && (
              <div className="mt-4 p-3 bg-pink-500/20 border border-pink-500 rounded-lg">
                <p className="text-xs text-pink-300">
                  ✓ Image selected! Click on a t-shirt template to place it.
                </p>
              </div>
            )}

            <div className="space-y-3 mt-4">
              {uploadedImages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No images uploaded yet</p>
              ) : (
                uploadedImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                      selectedImage === image.id 
                        ? 'border-pink-500 ring-2 ring-pink-500/50 scale-105' 
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => handleImageClick(image.id)}
                  >
                    <img src={image.url} alt={image.name} className="w-full h-32 object-contain bg-gray-800" />
                    {selectedImage === image.id && (
                      <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded">
                        Selected
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center - T-shirt Templates */}
        <div className="flex-1 bg-gray-950 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Main T-shirt Views */}
            <div className="grid grid-cols-2 gap-6">
              {/* Front View */}
              <div className="relative">
                <div
                  className="relative bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 template-container"
                  style={{ aspectRatio: '3/4' }}
                  onClick={(e) => {
                    // Don't place new image if dragging an existing one
                    if (!draggingDesign) {
                      handleTemplateClick(e, 'front');
                    }
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="text-gray-600 text-sm">FRONT</div>
                    {!selectedImage && (
                      <div className="absolute bottom-4 text-xs text-gray-500">Select an image, then click here</div>
                    )}
                  </div>
                  {/* Grid Overlay */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  {/* Designs */}
                  {designs.front.map((design) => {
                    const imageUrl = getImageUrl(design.imageId);
                    if (!imageUrl) return null;
                    return (
                      <div
                        key={design.id}
                        className="absolute border-2 border-white z-10 group cursor-move"
                        style={{
                          left: `${design.x}%`,
                          top: `${design.y}%`,
                          width: `${design.width}%`,
                          height: `${design.height}%`,
                          transform: `rotate(${design.rotation}deg)`,
                          cursor: draggingDesign?.id === design.id ? 'grabbing' : 'grab',
                        }}
                        onMouseDown={(e) => handleDragStart(e, 'front', design.id)}
                      >
                        <img src={imageUrl} alt="Design" className="w-full h-full object-contain bg-white/10 pointer-events-none" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDesign('front', design.id);
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center z-20 pointer-events-auto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {/* Resize handle */}
                        <div
                          onMouseDown={(e) => handleResizeStart(e, 'front', design.id)}
                          className="resize-handle absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 border-2 border-white pointer-events-auto"
                          style={{ transform: 'translate(50%, 50%)' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Back View */}
              <div className="relative">
                <div
                  className="relative bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 template-container"
                  style={{ aspectRatio: '3/4' }}
                  onClick={(e) => {
                    if (!draggingDesign) {
                      handleTemplateClick(e, 'back');
                    }
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="text-gray-600 text-sm">BACK</div>
                    {!selectedImage && (
                      <div className="absolute bottom-4 text-xs text-gray-500">Select an image, then click here</div>
                    )}
                  </div>
                  {/* Grid Overlay */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  {/* Designs */}
                  {designs.back.map((design) => {
                    const imageUrl = getImageUrl(design.imageId);
                    if (!imageUrl) return null;
                    return (
                      <div
                        key={design.id}
                        className="absolute border-2 border-white z-10 group cursor-move"
                        style={{
                          left: `${design.x}%`,
                          top: `${design.y}%`,
                          width: `${design.width}%`,
                          height: `${design.height}%`,
                          transform: `rotate(${design.rotation}deg)`,
                          cursor: draggingDesign?.id === design.id ? 'grabbing' : 'grab',
                        }}
                        onMouseDown={(e) => handleDragStart(e, 'back', design.id)}
                      >
                        <img src={imageUrl} alt="Design" className="w-full h-full object-contain bg-white/10 pointer-events-none" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDesign('back', design.id);
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center z-20 pointer-events-auto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {/* Resize handle */}
                        <div
                          onMouseDown={(e) => handleResizeStart(e, 'back', design.id)}
                          className="resize-handle absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 border-2 border-white pointer-events-auto"
                          style={{ transform: 'translate(50%, 50%)' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sleeve Views */}
            <div className="grid grid-cols-2 gap-6">
              <div
                className="relative bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 template-container"
                style={{ aspectRatio: '2/3', height: '200px' }}
                onClick={(e) => {
                  if (!draggingDesign) {
                    handleTemplateClick(e, 'leftSleeve');
                  }
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <div className="text-gray-600 text-sm">LEFT SLEEVE</div>
                  {!selectedImage && (
                    <div className="absolute bottom-2 text-xs text-gray-500">Select an image, then click here</div>
                  )}
                </div>
                {designs.leftSleeve.map((design) => {
                  const imageUrl = getImageUrl(design.imageId);
                  if (!imageUrl) return null;
                  return (
                    <div
                      key={design.id}
                      className="absolute border-2 border-white z-10 group cursor-move"
                      style={{
                        left: `${design.x}%`,
                        top: `${design.y}%`,
                        width: `${design.width}%`,
                        height: `${design.height}%`,
                        transform: `rotate(${design.rotation}deg)`,
                        cursor: draggingDesign?.id === design.id ? 'grabbing' : 'grab',
                      }}
                      onMouseDown={(e) => handleDragStart(e, 'leftSleeve', design.id)}
                    >
                      <img src={imageUrl} alt="Design" className="w-full h-full object-contain bg-white/10 pointer-events-none" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDesign('leftSleeve', design.id);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center z-20 pointer-events-auto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {/* Resize handle */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, 'leftSleeve', design.id)}
                        className="resize-handle absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 border-2 border-white pointer-events-auto"
                        style={{ transform: 'translate(50%, 50%)' }}
                      />
                    </div>
                  );
                })}
              </div>

              <div
                className="relative bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 template-container"
                style={{ aspectRatio: '2/3', height: '200px' }}
                onClick={(e) => {
                  if (!draggingDesign) {
                    handleTemplateClick(e, 'rightSleeve');
                  }
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <div className="text-gray-600 text-sm">RIGHT SLEEVE</div>
                  {!selectedImage && (
                    <div className="absolute bottom-2 text-xs text-gray-500">Select an image, then click here</div>
                  )}
                </div>
                {designs.rightSleeve.map((design) => {
                  const imageUrl = getImageUrl(design.imageId);
                  if (!imageUrl) return null;
                  return (
                    <div
                      key={design.id}
                      className="absolute border-2 border-white z-10 group cursor-move"
                      style={{
                        left: `${design.x}%`,
                        top: `${design.y}%`,
                        width: `${design.width}%`,
                        height: `${design.height}%`,
                        transform: `rotate(${design.rotation}deg)`,
                        cursor: draggingDesign?.id === design.id ? 'grabbing' : 'grab',
                      }}
                      onMouseDown={(e) => handleDragStart(e, 'rightSleeve', design.id)}
                    >
                      <img src={imageUrl} alt="Design" className="w-full h-full object-contain bg-white/10 pointer-events-none" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDesign('rightSleeve', design.id);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center z-20 pointer-events-auto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {/* Resize handle */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, 'rightSleeve', design.id)}
                        className="resize-handle absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 border-2 border-white pointer-events-auto"
                        style={{ transform: 'translate(50%, 50%)' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - 3D Preview and Color */}
        <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="flex-1 p-4">
            {/* 3D Preview */}
            <div className="relative bg-gray-950 rounded-lg overflow-hidden mb-6" style={{ height: '400px' }}>
              <Canvas>
                <Suspense fallback={null}>
                  <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <Environment preset="city" />
                  <ShirtModel color={shirtColor} designs={designs} uploadedImages={uploadedImages} />
                  <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} />
                </Suspense>
              </Canvas>
              
              {/* 3D Controls */}
              <div className="absolute top-2 right-2 flex gap-2">
                <button className="p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors">
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>
                <button className="p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors">
                  <Grid className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-full px-3 py-1">
                <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="text-white">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-white text-xs">{zoom}%</span>
                <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="text-white">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Color Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300 uppercase tracking-wide">COLOR</label>
              <div className="relative">
                <input
                  type="color"
                  value={shirtColor}
                  onChange={handleColorChange}
                  className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-700"
                />
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #00ffff, #0000ff, #8b00ff, #ff00ff)`,
                    opacity: 0.3,
                  }}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShirtColor('#000000')}
                  className="w-10 h-10 rounded border-2 border-gray-700 bg-black"
                />
                <button
                  onClick={() => setShirtColor('#ffffff')}
                  className="w-10 h-10 rounded border-2 border-gray-700 bg-white"
                />
                <button
                  onClick={() => setShirtColor('#808080')}
                  className="w-10 h-10 rounded border-2 border-gray-700 bg-gray-500"
                />
                <button
                  onClick={() => setShirtColor('#ff0000')}
                  className="w-10 h-10 rounded border-2 border-gray-700 bg-red-600"
                />
                <button
                  onClick={() => setShirtColor('#0000ff')}
                  className="w-10 h-10 rounded border-2 border-gray-700 bg-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {}}
      />
      <Login
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {}}
      />
      <UserProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

