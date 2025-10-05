import * as THREE from 'three'
import { gsap } from 'gsap'
export default class Models {
	constructor(gl_app) {
        this.scene = gl_app.scene
        this.group = new THREE.Group()
        this.scene.add(this.group)
        // Grid parameters
        this.gridSize = 24
        this.spacing = 0.65
        this.grids_config = [
            {
                id: 'heart',
                mask: `heart.jpg`,
                video: `fruits_trail_squared-transcode.mp4`
            },
            {
                id: 'codrops',
                mask: `codrops.jpg`,
                video: `KinectCube_1350-transcode.mp4`
            },
            {
                id: 'smile',
                mask: `smile.jpg`,
                video: `infinte-grid_squared-transcode.mp4`
            },
        ]
        this.grids_config.forEach((config, index) => this.createMask(config, index))
        this.group.scale.setScalar(0.15)
        this.is_ready = true
        this.grids = []


		// this.createMask()
    }

	createMask(config, index) {
        // Create a canvas to read mask pixel data
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const maskImage = new Image()
        maskImage.crossOrigin = 'anonymous'
        maskImage.onload = () => {
            // Get original image dimensions to preserve aspect ratio
            const originalWidth = maskImage.width
            const originalHeight = maskImage.height
            const aspectRatio = originalWidth / originalHeight

            // Calculate grid dimensions based on aspect ratio
            this.gridWidth
			this.gridHeight
            if (aspectRatio > 1) {
                // Image is wider than tall
                this.gridWidth = this.gridSize
                this.gridHeight = Math.round(this.gridSize / aspectRatio)
            } else {
                // Image is taller than wide or square
                this.gridHeight = this.gridSize
                this.gridWidth = Math.round(this.gridSize * aspectRatio)
            }

            canvas.width = this.gridWidth
            canvas.height = this.gridHeight
            ctx.drawImage(maskImage, 0, 0, this.gridWidth, this.gridHeight)

            const imageData = ctx.getImageData(0, 0, this.gridWidth, this.gridHeight)
            this.data = imageData.data
			this.createGrid(config, index)
		}

        maskImage.src = `../images/${config.mask}`
	}




    createVideoTexture(config, index) {
		this.video = document.createElement('video')
		this.video.src = `../videos/${config.video}`
		this.video.crossOrigin = 'anonymous'
		this.video.loop = true
		this.video.muted = true
		this.video.play()

		// Create video texture
		this.videoTexture = new THREE.VideoTexture(this.video)
		this.videoTexture.minFilter = THREE.LinearFilter
		this.videoTexture.magFilter = THREE.LinearFilter
		this.videoTexture.colorSpace = THREE.SRGBColorSpace
		this.videoTexture.wrapS = THREE.ClampToEdgeWrap
		this.videoTexture.wrapT = THREE.ClampToEdgeWrap

		// Create material with video texture
		this.material = new THREE.MeshBasicMaterial({ 
			map: this.videoTexture,
			side: THREE.FrontSide
		})
    }


    createGrid(config, index) {
        this.createVideoTexture(config, index)
        const grid_group = new THREE.Group()
        this.group.add(grid_group)


        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                
                const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

                // Get pixel color from mask (sample at grid position)
                // Flip Y coordinate to match image orientation
                const flippedY = this.gridHeight - 1 - y
                const pixelIndex = (flippedY * this.gridWidth + x) * 4
                const r = this.data[pixelIndex]
                const g = this.data[pixelIndex + 1]
                const b = this.data[pixelIndex + 2]

                // Calculate brightness (0 = black, 255 = white)
                const brightness = (r + g + b) / 3

                // Only create box if pixel is dark (black shows, white hides)
                if (brightness < 128) { // Threshold for black vs white

                    // Create individual geometry for each box to have unique UV mapping
                    // Calculate UV coordinates for this specific box
                    const uvX = x / this.gridSize
                    const uvY = y / this.gridSize // Remove the flip to match correct orientation
                    const uvWidth = 1 / this.gridSize
                    const uvHeight = 1 / this.gridSize
                    
                    // Get the UV attribute
                    const uvAttribute = geometry.attributes.uv
                    const uvArray = uvAttribute.array
                    
                    // Map each face of the box to show the same portion of video
                    // We'll focus on the front face (face 4) for the main projection
                    for (let i = 0; i < uvArray.length; i += 2) {
                        // Map all faces to the same UV region for consistency
                        uvArray[i] = uvX + (uvArray[i] * uvWidth)     // U coordinate
                        uvArray[i + 1] = uvY + (uvArray[i + 1] * uvHeight) // V coordinate
                    }
                    
                    // Mark the attribute as needing update
                    uvAttribute.needsUpdate = true
                    

                    /* ________ CONTINUING */
                    /* ________ CONTINUING */
                    /* ________ CONTINUING */
                    const mesh = new THREE.Mesh(geometry, this.material);

                    mesh.position.x = (x - (this.gridSize - 1) / 2) * this.spacing;
                    mesh.position.y = (y - (this.gridSize - 1) / 2) * this.spacing;
                    mesh.position.z = 0;

                    grid_group.add(mesh);
                }
            }
        }
        grid_group.name = config.id
        this.grids.push(grid_group);

        this.initInteractions()
    }
    
    initInteractions() {

        this.current = 'heart'
        this.old = null
        this.is_animating = false
        this.duration = 1

        this.DOM = {
            $btns: document.querySelectorAll('.btns__item button'),
            $canvas: document.querySelector('canvas')
        }
        this.grids.forEach(grid => {
            if(grid.name != this.current) {
                grid.children.forEach(mesh => mesh.scale.setScalar(0))
            }
        })
        this.bindEvents()
    }

    bindEvents() {
        this.DOM.$btns.forEach(($btn, index) => {
            $btn.addEventListener('click', () => {
                if (this.is_animating) return
                this.is_animating = true
                this.DOM.$btns.forEach(($btn, btnIndex) => {
                    btnIndex === index ? $btn.classList.add('active') : $btn.classList.remove('active')
                })
                this.old = this.current
                this.current = `${$btn.dataset.id}`
                this.revealGrid()
                this.hideGrid()
            })
        })
    }
    revealGrid() {
        // Filter the current grid based on this.current value
        const grid = this.grids.find(item => item.name === this.current);
        
        this.DOM.$canvas.dataset.current = `${this.current}` 
        const tl = gsap.timeline({ delay: this.duration * 0.25, defaults: { ease: 'power1.out', duration: this.duration } })
        grid.children.forEach((child, index) => {
            tl
                .to(child.scale, { x: 1, y: 1, z: 1, ease: 'power3.inOut' }, index * 0.001)
                .to(child.position, { z: 0 }, '<')
        })
    }

    hideGrid() {
        // Filter the current grid based on this.old value
        const grid = this.grids.find(item => item.name === this.old);
        const tl = gsap.timeline({
            defaults: { ease: 'power1.out', duration: this.duration },
            onComplete: () => { this.is_animating = false }
        })
        grid.children.forEach((child, index) => {
            tl
                .to(child.scale, { x: 0, y: 0, z: 0, ease: 'power3.inOut' }, index * 0.001)
                .to(child.position, {
                    z: 6, onComplete: () => {
                        gsap.set(child.scale, { x: 0, y: 0, z: 0 })
                        gsap.set(child.position, { z: - 6 })
                    }
                }, '<')
        })
    }
}


