import { createFileRoute } from '@tanstack/react-router'
import BasicAITranslationDemo from '@/components/BasicAITranslationDemo'

export const Route = createFileRoute('/_layout/ai-translation-demo')({
  component: BasicAITranslationDemo,
})