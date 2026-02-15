
"use client"

import { useEffect, useRef } from 'react'

/**
 * @fileOverview A touch-responsive canvas background featuring neural ripples and floating bubbles.
 * Inspired by the glass-ripple and bubble-pop aesthetic.
 */

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let ripples: { x: number; y: number; radius: number; opacity: number }[] = []
    let bubbles: { x: number; y: number; size: number; vy: number; opacity: number; text: string; scale: number; targetScale: number }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 1. Draw Glass Ripples
      ripples.forEach((r, i) => {
        r.radius += 2.5
        r.opacity = 1 - r.radius / 120
        
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(59, 130, 246, ${r.opacity * 0.4})`
        ctx.lineWidth = 2
        ctx.stroke()
        
        if (r.radius > 120) ripples.splice(i, 1)
      })

      // 2. Draw Floating Bubbles
      bubbles.forEach((b, i) => {
        // Animation logic
        b.y += b.vy
        b.scale += (b.targetScale - b.scale) * 0.1
        b.opacity -= 0.008

        const currentSize = b.size * b.scale

        ctx.beginPath()
        ctx.arc(b.x, b.y, currentSize, 0, Math.PI * 2)
        // Glassy gradient for the bubble
        const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, currentSize)
        gradient.addColorStop(0, `rgba(59, 130, 246, ${b.opacity * 0.3})`)
        gradient.addColorStop(1, `rgba(59, 130, 246, ${b.opacity * 0.1})`)
        
        ctx.fillStyle = gradient
        ctx.fill()
        ctx.strokeStyle = `rgba(255, 255, 255, ${b.opacity * 0.2})`
        ctx.lineWidth = 1
        ctx.stroke()
        
        // Text inside bubble
        ctx.font = `${Math.floor(10 * b.scale)}px Space Grotesk`
        ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.8})`
        ctx.textAlign = 'center'
        ctx.fillText(b.text, b.x, b.y + (4 * b.scale))

        if (b.opacity <= 0) bubbles.splice(i, 1)
      })

      requestAnimationFrame(draw)
    }

    const handleInteraction = (x: number, y: number) => {
      // Create Ripple
      ripples.push({ x, y, radius: 0, opacity: 1 })
      
      // Create "AI Answer" style bubble
      const texts = ["NEURAL", "SYNC", "LOGIC", "AI", "AUDIT", "READY"]
      bubbles.push({
        x,
        y,
        size: 35 + Math.random() * 15,
        vy: -1 - Math.random(),
        opacity: 1,
        text: texts[Math.floor(Math.random() * texts.length)],
        scale: 0,
        targetScale: 1
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
      className="fixed inset-0 pointer-events-none z-[1] opacity-60 select-none"
    />
  )
}
