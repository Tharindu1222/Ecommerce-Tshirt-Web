import { useState, useRef, Suspense, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { ArrowLeft, Upload, X, RotateCcw, Grid, ZoomIn, ZoomOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { Navbar } from './Navbar';
import { Cart } from './Cart';
import { Login } from './Login';
import { UserProfile } from './UserProfile';

// Camera component that responds to zoom
function ZoomableCamera({ zoom }: { zoom: number }) {
  const { camera } = useThree();
  
  useFrame(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      // Convert percentage to zoom value (100% = 1.0, 200% = 2.0, 50% = 0.5)
      const zoomValue = zoom / 100;
      
      // Only update if zoom actually changed to avoid unnecessary updates
      if (Math.abs(camera.zoom - zoomValue) > 0.01) {
        camera.zoom = zoomValue;
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
}

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

    // Helper to draw a set of designs into a specific region of the texture
    const drawDesignsInRegion = async (
      view: keyof typeof designs,
      region: { x: number; y: number; w: number; h: number }
    ) => {
      for (const design of designs[view]) {
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

          const x = region.x + (design.x / 100) * region.w;
          const y = region.y + (design.y / 100) * region.h;
          const width = (design.width / 100) * region.w;
          const height = (design.height / 100) * region.h;

          ctx.save();
          ctx.translate(x + width / 2, y + height / 2);
          ctx.rotate((design.rotation * Math.PI) / 180);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          ctx.restore();
        } catch (err) {
          console.error('Error loading image:', err);
        }
      }
    };

    // Load and draw all images
    const loadAndDrawImages = async () => {
      // Clear and redraw base color
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Define texture atlas regions (2x2 grid):
      // Top-left: front, Top-right: back, Bottom-left: left sleeve, Bottom-right: right sleeve
      const halfW = canvas.width / 2;
      const halfH = canvas.height / 2;
      const regions = {
        front: { x: 0, y: 0, w: halfW, h: halfH },
        back: { x: halfW, y: 0, w: halfW, h: halfH },
        leftSleeve: { x: 0, y: halfH, w: halfW, h: halfH },
        rightSleeve: { x: halfW, y: halfH, w: halfW, h: halfH },
      } as const;

      await drawDesignsInRegion('front', regions.front);
      await drawDesignsInRegion('back', regions.back);
      await drawDesignsInRegion('leftSleeve', regions.leftSleeve);
      await drawDesignsInRegion('rightSleeve', regions.rightSleeve);

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
        if (textureRef.current) {
          // Keep map colors accurate; avoid tinting by forcing white
          material.color.set('#ffffff');
          material.map = textureRef.current;
        } else {
          material.color.copy(colorObj);
          material.map = null;
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
  const [selectedDesign, setSelectedDesign] = useState<{ view: typeof activeView; id: string } | null>(null);
  const [shirtColor, setShirtColor] = useState('#FFFFFF');
  const [designs, setDesigns] = useState<Record<string, Array<{ id: string; imageId: string; x: number; y: number; width: number; height: number; rotation: number }>>>({
    front: [],
    back: [],
    leftSleeve: [],
    rightSleeve: [],
  });
  const [activeView] = useState<'front' | 'back' | 'leftSleeve' | 'rightSleeve'>('front');
  const [zoom, setZoom] = useState(450);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [resizingDesign, setResizingDesign] = useState<{ view: typeof activeView; id: string } | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [draggingDesign, setDraggingDesign] = useState<{ view: typeof activeView; id: string } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; designX: number; designY: number; containerWidth: number; containerHeight: number } | null>(null);
  const [rotatingDesign, setRotatingDesign] = useState<{ view: typeof activeView; id: string } | null>(null);
  const [rotateStart, setRotateStart] = useState<{ x: number; angle: number } | null>(null);

  const processFiles = (files: FileList) => {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
  };

  const handleDragOverUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFiles(true);
  };

  const handleDragLeaveUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFiles(false);
  };

  const handleDropUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    if (e.dataTransfer?.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleImageClick = (imageId: string) => {
    setSelectedImage(imageId);
  };

  const addDesignAt = (view: typeof activeView, imageId: string, x: number, y: number) => {
    const newDesign = {
      id: Date.now().toString(),
      imageId,
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
    setSelectedDesign({ view, id: newDesign.id });
  };

  const handleTemplateDrop = (e: React.DragEvent<HTMLDivElement>, view: typeof activeView) => {
    e.preventDefault();
    const imageId = e.dataTransfer.getData('image-id');
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (imageId) {
      addDesignAt(view, imageId, x, y);
      setSelectedImage(imageId);
      return;
    }

    // If files are dropped directly on the template, upload them
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeDesign = (view: typeof activeView, designId: string) => {
    setDesigns((prev) => ({
      ...prev,
      [view]: prev[view].filter((d) => d.id !== designId),
    }));
    if (selectedDesign && selectedDesign.id === designId && selectedDesign.view === view) {
      setSelectedDesign(null);
    }
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

    setSelectedDesign({ view, id: designId });

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

  const updateSelectedDesign = (updates: Partial<{ rotation: number }>) => {
    if (!selectedDesign) return;
    setDesigns((prev) => ({
      ...prev,
      [selectedDesign.view]: prev[selectedDesign.view].map((d) =>
        d.id === selectedDesign.id ? { ...d, ...updates } : d
      ),
    }));
  };

  const handleRotateStart = (e: React.MouseEvent, view: typeof activeView, designId: string) => {
    e.stopPropagation();
    const design = designs[view].find((d) => d.id === designId);
    if (!design) return;
    setSelectedDesign({ view, id: designId });
    setRotatingDesign({ view, id: designId });
    setRotateStart({ x: e.clientX, angle: design.rotation });
  };

  const handleRotateMove = (e: MouseEvent) => {
    if (!rotatingDesign || !rotateStart) return;
    const delta = (e.clientX - rotateStart.x) * 0.5; // degrees per pixel factor
    const newAngle = ((rotateStart.angle + delta) % 360 + 360) % 360;
    setDesigns((prev) => ({
      ...prev,
      [rotatingDesign.view]: prev[rotatingDesign.view].map((d) =>
        d.id === rotatingDesign.id ? { ...d, rotation: newAngle } : d
      ),
    }));
  };

  const handleRotateEnd = () => {
    setRotatingDesign(null);
    setRotateStart(null);
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

  // Add global mouse event listeners for rotating
  useEffect(() => {
    if (rotatingDesign && rotateStart) {
      const handleMove = (e: MouseEvent) => handleRotateMove(e);
      const handleEnd = () => handleRotateEnd();
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
      };
    }
  }, [rotatingDesign, rotateStart]);

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
            <div
              onDragOver={handleDragOverUpload}
              onDragEnter={handleDragOverUpload}
              onDragLeave={handleDragLeaveUpload}
              onDrop={handleDropUpload}
              className={`w-full rounded-lg border-2 border-dashed transition-colors ${
                isDraggingFiles ? 'border-pink-500 bg-pink-500/10' : 'border-gray-700 bg-gray-900/60'
              }`}
            >
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
              <p className="text-xs text-gray-400 text-center py-3">
                Drag & drop PNG or JPG (max. 10MB) here, or click to upload
              </p>
            </div>

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
                     draggable
                     onDragStart={(e) => {
                       e.dataTransfer.setData('image-id', image.id);
                       e.dataTransfer.effectAllowed = 'copy';
                     }}
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
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleTemplateDrop(e, 'front')}
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="text-gray-600 text-sm">FRONT</div>
                     <div className="absolute bottom-4 text-xs text-gray-500">Drag an image here to place</div>
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
                         className={`absolute z-10 group cursor-move ${selectedDesign?.id === design.id && selectedDesign.view === 'front' ? 'border-2 border-pink-500' : 'border-2 border-white'}`}
                        style={{
                          left: `${design.x}%`,
                          top: `${design.y}%`,
                          width: `${design.width}%`,
                          height: `${design.height}%`,
                          transform: `rotate(${design.rotation}deg)`,
                          cursor: draggingDesign?.id === design.id ? 'grabbing' : 'grab',
                        }}
                        onMouseDown={(e) => handleDragStart(e, 'front', design.id)}
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedDesign({ view: 'front', id: design.id });
                         }}
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
                        <button
                          onMouseDown={(e) => handleRotateStart(e, 'front', design.id)}
                          className="absolute bottom-1 left-1 w-7 h-7 bg-black/80 rounded-full flex items-center justify-center z-20 pointer-events-auto border border-pink-500 shadow-lg hover:bg-pink-500/20 transition-colors cursor-grab active:cursor-grabbing"
                          title="Drag to rotate"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
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
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleTemplateDrop(e, 'back')}
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="text-gray-600 text-sm">BACK</div>
                     <div className="absolute bottom-4 text-xs text-gray-500">Drag an image here to place</div>
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
                         className={`absolute z-10 group cursor-move ${selectedDesign?.id === design.id && selectedDesign.view === 'back' ? 'border-2 border-pink-500' : 'border-2 border-white'}`}
                        style={{
                          left: `${design.x}%`,
                          top: `${design.y}%`,
                          width: `${design.width}%`,
                          height: `${design.height}%`,
                          transform: `rotate(${design.rotation}deg)`,
                          cursor: draggingDesign?.id === design.id ? 'grabbing' : 'grab',
                        }}
                        onMouseDown={(e) => handleDragStart(e, 'back', design.id)}
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedDesign({ view: 'back', id: design.id });
                         }}
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
                        <button
                          onMouseDown={(e) => handleRotateStart(e, 'back', design.id)}
                          className="absolute bottom-1 left-1 w-7 h-7 bg-black/80 rounded-full flex items-center justify-center z-20 pointer-events-auto border border-pink-500 shadow-lg hover:bg-pink-500/20 transition-colors cursor-grab active:cursor-grabbing"
                          title="Drag to rotate"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
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
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleTemplateDrop(e, 'leftSleeve')}
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <div className="text-gray-600 text-sm">LEFT SLEEVE</div>
                   <div className="absolute bottom-2 text-xs text-gray-500">Drag an image here to place</div>
                </div>
                {designs.leftSleeve.map((design) => {
                  const imageUrl = getImageUrl(design.imageId);
                  if (!imageUrl) return null;
                  return (
                    <div
                      key={design.id}
                       className={`absolute z-10 group cursor-move ${selectedDesign?.id === design.id && selectedDesign.view === 'leftSleeve' ? 'border-2 border-pink-500' : 'border-2 border-white'}`}
                      style={{
                        left: `${design.x}%`,
                        top: `${design.y}%`,
                        width: `${design.width}%`,
                        height: `${design.height}%`,
                        transform: `rotate(${design.rotation}deg)`,
                        cursor: draggingDesign?.id === design.id ? 'grabbing' : 'grab',
                      }}
                       onMouseDown={(e) => handleDragStart(e, 'leftSleeve', design.id)}
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedDesign({ view: 'leftSleeve', id: design.id });
                       }}
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
                      <button
                        onMouseDown={(e) => handleRotateStart(e, 'leftSleeve', design.id)}
                        className="absolute bottom-1 left-1 w-7 h-7 bg-black/80 rounded-full flex items-center justify-center z-20 pointer-events-auto border border-pink-500 shadow-lg hover:bg-pink-500/20 transition-colors cursor-grab active:cursor-grabbing"
                        title="Drag to rotate"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
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
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleTemplateDrop(e, 'rightSleeve')}
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <div className="text-gray-600 text-sm">RIGHT SLEEVE</div>
                   <div className="absolute bottom-2 text-xs text-gray-500">Drag an image here to place</div>
                </div>
                {designs.rightSleeve.map((design) => {
                  const imageUrl = getImageUrl(design.imageId);
                  if (!imageUrl) return null;
                  return (
                    <div
                      key={design.id}
                       className={`absolute z-10 group cursor-move ${selectedDesign?.id === design.id && selectedDesign.view === 'rightSleeve' ? 'border-2 border-pink-500' : 'border-2 border-white'}`}
                      style={{
                        left: `${design.x}%`,
                        top: `${design.y}%`,
                        width: `${design.width}%`,
                        height: `${design.height}%`,
                        transform: `rotate(${design.rotation}deg)`,
                        cursor: draggingDesign?.id === design.id ? 'grabbing' : 'grab',
                      }}
                       onMouseDown={(e) => handleDragStart(e, 'rightSleeve', design.id)}
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedDesign({ view: 'rightSleeve', id: design.id });
                       }}
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
                      <button
                        onMouseDown={(e) => handleRotateStart(e, 'rightSleeve', design.id)}
                        className="absolute bottom-1 left-1 w-7 h-7 bg-black/80 rounded-full flex items-center justify-center z-20 pointer-events-auto border border-pink-500 shadow-lg hover:bg-pink-500/20 transition-colors cursor-grab active:cursor-grabbing"
                        title="Drag to rotate"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
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

            {/* Rotation controls for selected design */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
              {selectedDesign ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const current = designs[selectedDesign.view].find((d) => d.id === selectedDesign.id);
                        const next = ((current?.rotation ?? 0) + 15) % 360;
                        updateSelectedDesign({ rotation: next });
                      }}
                      className="p-2 rounded-full border border-pink-500 text-white hover:bg-pink-500/20 transition-colors"
                      title="Rotate +15°"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateSelectedDesign({ rotation: 0 })}
                      className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-white border border-gray-700"
                    >
                      Reset
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    {(() => {
                      const d = designs[selectedDesign.view].find((x) => x.id === selectedDesign.id);
                      return d ? `${Math.round(d.rotation)}°` : '';
                    })()}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  Select a placed design to rotate it.
                </div>
              )}
            </div>
          </div>
        </div>

         {/* Right Sidebar - 3D Preview and Color */}
        <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="flex-1 p-4">
            {/* 3D Preview */}
            <div className="relative rounded-lg overflow-hidden mb-6" style={{ height: '400px', background: 'radial-gradient(circle at center, #374151 0%, #111827 100%)' }}>
              <Canvas shadows>
                <Suspense fallback={null}>
                  <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                  <ZoomableCamera zoom={zoom} />
                  <ambientLight intensity={0.7} />
                  <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                  <Environment preset="city" />
                  <ShirtModel color={shirtColor} designs={designs} uploadedImages={uploadedImages} />
                  <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} color="#000000" />
                  <OrbitControls 
                    enableZoom={false} 
                    enablePan={false} 
                    enableRotate={true}
                    minDistance={2}
                    maxDistance={10}
                  />
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
                <button onClick={() => setZoom(Math.min(300, zoom + 10))} className="text-white">
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

