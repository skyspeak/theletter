import { DigestSignup } from '../components/DigestSignup'
import { BrandMark } from '../components/BrandMark'
import { motion } from 'framer-motion'

export function LetterHomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-16 sm:pt-24 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <BrandMark size="lg" as="h1" />
        <p className="mt-6 text-xl sm:text-2xl text-ink/70 font-light leading-snug max-w-xl mx-auto">
          Get up to speed on Industry, AI and Technology news in 15 minutes every Sunday.
        </p>
      </motion.div>

      <DigestSignup sourceRef="letter-home" />
    </div>
  )
}
