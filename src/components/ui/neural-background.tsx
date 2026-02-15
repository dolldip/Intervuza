"use client"

import { useEffect, useRef, useState } from 'react'

/**
 * @fileOverview A touch-responsive canvas background featuring neural ripples and floating DOM bubbles.
 * Inspired by the glass-ripple and bubble-pop aesthetic.
 * Revised: Removed text labels from bubbles for a purely visual experience.
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
        r.radius += 2.5
        r.opacity = 1 - r.radius / 150
        
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(59, 130, 246, ${r.opacity * 0.5})`
        ctx.lineWidth = 2
        ctx.stroke()
        
        if (r.radius > 150) ripples.splice(i, 1)
      })

      requestAnimationFrame(draw)
    }

    const showBubble = (x: number, y: number) => {
      // Create a floating glassy bubble (pure visual, no text)
      const bubble = document.createElement('div')
      bubble.style.position = 'fixed'
      bubble.style.left = `${x}px`
      bubble.style.top = `${y}px`
      bubble.style.transform = 'translate(-50%, -50%) scale(0)'
      bubble.style.width = '70px'
      bubble.style.height = '70px'
      bubble.style.borderRadius = '50%'
      bubble.style.background = 'rgba(59, 130, 246, 0.12)'
      bubble.style.backdropFilter = 'blur(12px)'
      bubble.style.border = '1px solid rgba(255, 255, 255, 0.25)'
      bubble.style.pointerEvents = 'none'
      bubble.style.zIndex = '9999'
      bubble.style.transition = 'transform 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.9s ease'
      bubble.style.boxShadow = 'inset 0 0 25px rgba(255, 255, 255, 0.15), 0 15px 45px rgba(0, 0, 0, 0.4)'
      
      document.body.appendChild(bubble)
      
      // Pop in
      requestAnimationFrame(() => {
        bubble.style.transform = 'translate(-50%, -50%) scale(1)'
      })
      
      // Float up and vanish
      setTimeout(() => {
        bubble.style.transform = 'translate(-50%, -250%) scale(1.4)'
        bubble.style.opacity = '0'
        setTimeout(() => {
          if (bubble.parentNode) bubble.remove()
        }, 800)
      }, 900)
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
      className="fixed inset-0 pointer-events-none z-0 opacity-60 select-none"
    />
  )
}
