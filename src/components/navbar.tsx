"use client"

import React from "react"
import { motion } from "framer-motion"

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-16 items-center">
        <div className="w-1/3">
          {/* Left side empty space */}
        </div>
        
        {/* Center logo area with trademark - exactly as provided */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold"
          >
            gregcodes<span className="text-xs align-top">™</span>
          </motion.div>
        </div>
        
        <div className="w-1/3">
          {/* Right side empty space */}
        </div>
      </div>
    </motion.header>
  )
}