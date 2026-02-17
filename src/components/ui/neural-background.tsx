"use client"

import { useEffect, useRef, useState } from 'react'

/**
 * @fileOverview A touch-responsive canvas background featuring neural ripples and floating DOM bubbles.
 * Inspired by the glass-ripple and bubble-pop aesthetic.
 * Revised: Reduced size of interaction elements for better mobile experience.
 */

export function NeuralBackground() {
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let ripples: { x: number; y: number; radius: number; opacity: number }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw Glass Ripples
      ripples.forEach((r, i) => {
        r.radius += 2.0
        // Max radius reduced for mobile clarity (from 100 to 40)
        const maxRadius = 40
        r.opacity = 1 - r.radius / maxRadius
        
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(59, 130, 246, ${r.opacity * 0.4})`
        ctx.lineWidth = 1.0
        ctx.stroke()
        
        if (r.radius > maxRadius) ripples.splice(i, 1)
      })

      requestAnimationFrame(draw)
    }

    const showBubble = (x: number, y: number) => {
      // Create a floating glassy bubble
      const bubble = document.createElement('div')
      bubble.style.position = 'fixed'
      bubble.style.left = `${x}px`
      bubble.style.top = `${y}px`
      bubble.style.transform = 'translate(-50%, -50%) scale(0)'
      // Reduced size for phone/tablet (from 40px to 24px)
      bubble.style.width = '24px'
      bubble.style.height = '24px'
      bubble.style.borderRadius = '50%'
      bubble.style.background = 'rgba(59, 130, 246, 0.12)'
      bubble.style.backdropFilter = 'blur(4px)'
      bubble.style.border = '1px solid rgba(255, 255, 255, 0.1)'
      bubble.style.pointerEvents = 'none'
      bubble.style.zIndex = '9999'
      bubble.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s ease'
      
      document.body.appendChild(bubble)
      
      // Pop in
      requestAnimationFrame(() => {
        bubble.style.transform = 'translate(-50%, -50%) scale(1)'
      })
      
      // Float up and vanish
      setTimeout(() => {
        bubble.style.transform = 'translate(-50%, -150%) scale(1.1)'
        bubble.style.opacity = '0'
        setTimeout(() => {
          if (bubble.parentNode) bubble.remove()
        }, 600)
      }, 500)
    }

    const handleInteraction = (x: number, y: number) => {
      ripples.push({ x, y, radius: 0, opacity: 1 })
      showBubble(x, y)
    }

    const onMouseDown = (e: MouseEvent) => handleInteraction(e.clientX, e.clientY)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) handleInteraction(e.touches[0].clientX, e.touches[0].clientY)
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('touchstart', onTouchStart)

    const animationId = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('touchstart', onTouchStart)
      cancelAnimationFrame(animationId)
    }
  }, [mounted])

  if (!mounted) return null

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 opacity-40 select-none"
    />
  )
}