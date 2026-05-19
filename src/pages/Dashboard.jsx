import { motion } from 'framer-motion'
import PromptGenerator from '../components/PromptGenerator'
import TrendSection from '../components/TrendSection'

export default function Dashboard(){
  return (
    <div className="min-h-screen bg-midnight text-white overflow-x-hidden selection:bg-accent selection:text-white">
      {/* Animated Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-20 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-extrabold tracking-tighter mb-4 bg-gradient-to-r from-white via-accent to-blue-400 bg-clip-text text-transparent">
            MetaPrompt Studio
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Craft cinematic AI prompts with precision. Transform simple ideas into breathtaking visual masterpieces.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-7"
          >
            <PromptGenerator />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-5"
          >
            <TrendSection />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

