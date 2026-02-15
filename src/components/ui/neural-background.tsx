
"use client"

import { useEffect, useRef } from 'react'

/**
 * @fileOverview A touch-responsive canvas background featuring neural ripples and floating bubbles.
 */

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let ripples: { x: number; y: number; radius: number; opacity: number }[] = []
    let bubbles: { x: number; y: number; size: number; vy: number; opacity: number; text: string }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw Ripples
      ripples.forEach((r, i) => {
        r.radius += 1.5
        r.opacity = 1 - r.radius / 150
        
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(59, 130, 246, ${r.opacity * 0.2})`
        ctx.lineWidth = 1.5
        ctx.stroke()
        
        if (r.radius > 150) ripples.splice(i, 1)
      })

      // Draw Floating Bubbles
      bubbles.forEach((b, i) => {
        b.y += b.vy
        b.opacity -= 0.005
        
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(59, 130, 246, ${b.opacity * 0.1})`
        ctx.fill()
        
        ctx.font = '8px Space Grotesk'
        ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.3})`
        ctx.textAlign = 'center'
        ctx.fillText(b.text, b.x, b.y + 3)

        if (b.opacity <= 0) bubbles.splice(i, 1)
      })

      requestAnimationFrame(draw)
    }

    const handleInteraction = (x: number, y: number) => {
      ripples.push({ x, y, radius: 0, opacity: 1 })
      
      // Add a floating logic bubble
      const texts = ["LOGIC", "SYNC", "AI", "AUDIT", "NEURAL"]
      bubbles.push({
        x,
        y,
        size: 20 + Math.random() * 20,
        vy: -0.5 - Math.random(),
        opacity: 0.8,
        text: texts[Math.floor(Math.random() * texts.length)]
      })
    }

    const onMouseDown = (e: MouseEvent) => handleInteraction(e.clientX, e.clientY)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) handleInteraction(e.touches[0].clientX, e.touches[0].clientY)
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('touchstart', onTouchStart)

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('touchstart', onTouchStart)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 opacity-40 select-none"
    />
  )
}
