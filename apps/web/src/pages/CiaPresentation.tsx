import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Bug,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  EyeOff,
  FileCheck,
  HelpCircle,
  KeyRound,
  Lightbulb,
  LockKeyhole,
  Maximize,
  Minimize,
  RotateCcw,
  Server,
  Share2,
  ShieldCheck,
  UserCheck,
  WifiOff,
  X,
  Zap,
} from 'lucide-react'
import { useBestScore } from '../hooks/usePersistentState'
import type { CiaDeck, PresentationIcon } from './presentationDecks'
import styles from './CiaPresentation.module.css'

const slideTypes = ['cover', 'content', 'content', 'content', 'content', 'table', 'closing'] as const

const iconMap: Record<PresentationIcon, typeof Server> = {
  server: Server,
  book: BookOpen,
  zap: Zap,
  shield: ShieldCheck,
  alert: AlertTriangle,
  help: HelpCircle,
  lock: LockKeyhole,
  key: KeyRound,
  eyeOff: EyeOff,
  database: Database,
  clock: Clock3,
  wifiOff: WifiOff,
  userCheck: UserCheck,
  share: Share2,
  bug: Bug,
  fileCheck: FileCheck,
}

type CiaPresentationProps = {
  deck: CiaDeck
}

export default function CiaPresentation({ deck }: CiaPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [showExplanation, setShowExplanation] = useState<number | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [quizMode, setQuizMode] = useState(false)
  const [bestScore, saveBestScore] = useBestScore(`triada:presentacion:${deck.id}:best`)
  const containerRef = useRef<HTMLDivElement>(null)

  const quizQuestions = deck.quiz
  const totalSlides = slideTypes.length
  const isFirstSlide = currentSlide === 0
  const isLastSlide = currentSlide === totalSlides - 1
  const score = quizQuestions.reduce(
    (total, question) => total + (quizAnswers[question.id] === question.correctAnswer ? 1 : 0),
    0,
  )

  useEffect(() => {
    if (showResults) saveBestScore(score)
  }, [saveBestScore, score, showResults])

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1))
  }, [totalSlides])

  const goToPrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0))
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setShowResults(false)
    setShowExplanation(null)
  }

  const handleAnswerSelect = (questionId: number, answer: string) => {
    if (showResults) return
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answer }))
    setShowExplanation(questionId)
  }

  const resetQuiz = () => {
    setQuizAnswers({})
    setShowResults(false)
    setShowExplanation(null)
  }

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen()
      } else if (document.exitFullscreen) {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Error al cambiar a pantalla completa:', err)
    }
  }, [])

  const enterQuizMode = () => {
    setQuizMode(true)
    setQuizAnswers({})
    setShowResults(false)
    setShowExplanation(null)
  }

  const exitQuizMode = useCallback(() => {
    setQuizMode(false)
    setQuizAnswers({})
    setShowResults(false)
    setShowExplanation(null)
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizMode) {
        if (e.key === 'Escape') {
          exitQuizMode()
        }
        return
      }
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [exitQuizMode, goToNext, goToPrev, quizMode, toggleFullscreen])

  const renderSlide = () => {
    const slideType = slideTypes[currentSlide]

    if (slideType === 'cover') {
      return (
        <div className={styles.coverSlide}>
          <div className={styles.coverContent}>
            <div className={styles.badge}>Tríada CIA</div>
            <h1 className={styles.coverTitle}>{deck.name}</h1>
            <p className={styles.coverSubtitle}>{deck.coverSubtitle}</p>
            <div className={styles.coverFooter}>
              <p>Seguridad de la Información</p>
            </div>
          </div>
        </div>
      )
    }

    if (slideType === 'content' && currentSlide === 1) {
      return (
        <div className={styles.contentSlide}>
          <header className={styles.slideHeader}>
            <span className={styles.slideNumber}>02</span>
            <h2 className={styles.slideTitle}>Objetivos</h2>
          </header>
          <div className={styles.slideBody}>
            <p className={styles.introText}>Al finalizar esta presentación, podrás:</p>
            <ul className={styles.bulletList}>
              {deck.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </div>
        </div>
      )
    }

    if (slideType === 'content' && currentSlide === 2) {
      return (
        <div className={styles.contentSlide}>
          <header className={styles.slideHeader}>
            <span className={styles.slideNumber}>03</span>
            <h2 className={styles.slideTitle}>¿Qué es la {deck.name.toLowerCase()}?</h2>
          </header>
          <div className={styles.slideBody}>
            <div className={styles.definitionBox}>
              <p className={styles.definitionText}>
                La <strong>{deck.name.toLowerCase()}</strong> {deck.definition}
              </p>
            </div>
            <div className={styles.analogyBox}>
              <h3 className={styles.analogyTitle}>
                <Lightbulb size={20} />
                <span>Analogía</span>
              </h3>
              <p>{deck.analogy}</p>
            </div>
            <div className={styles.keyPhrase}>
              <p>
                <strong>Definición fácil:</strong> {deck.keyPhrase}
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (slideType === 'content' && currentSlide === 3) {
      return (
        <div className={styles.contentSlide}>
          <header className={styles.slideHeader}>
            <span className={styles.slideNumber}>04</span>
            <h2 className={styles.slideTitle}>Ejemplos cotidianos</h2>
          </header>
          <div className={styles.slideBody}>
            <div className={styles.examplesGrid}>
              {deck.examples.map((example) => {
                const Icon = iconMap[example.icon]
                return (
                  <div className={styles.exampleCard} key={example.title}>
                    <div className={styles.exampleIcon}>
                      <Icon size={28} />
                    </div>
                    <h3>{example.title}</h3>
                    <p>{example.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    if (slideType === 'content' && currentSlide === 4) {
      return (
        <div className={styles.contentSlide}>
          <header className={styles.slideHeader}>
            <span className={styles.slideNumber}>05</span>
            <h2 className={styles.slideTitle}>¿Qué puede afectarla?</h2>
          </header>
          <div className={styles.slideBody}>
            <ul className={styles.threatList}>
              {deck.threats.map((threat) => {
                const Icon = iconMap[threat.icon]
                return (
                  <li key={threat.title}>
                    <span className={styles.threatIcon}>
                      <Icon size={22} />
                    </span>
                    <div>
                      <strong>{threat.title}</strong> - {threat.text}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )
    }

    if (slideType === 'table' && currentSlide === 5) {
      return (
        <div className={styles.contentSlide}>
          <header className={styles.slideHeader}>
            <span className={styles.slideNumber}>06</span>
            <h2 className={styles.slideTitle}>¿Cómo se protege?</h2>
          </header>
          <div className={styles.slideBody}>
            <div className={styles.tableWrapper}>
              <table className={styles.protectionTable}>
                <thead>
                  <tr>
                    <th>Medida</th>
                    <th>Explicación sencilla</th>
                  </tr>
                </thead>
                <tbody>
                  {deck.protections.map((protection) => (
                    <tr key={protection.measure}>
                      <td className={styles.measureName}>{protection.measure}</td>
                      <td>{protection.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    }

    if (slideType === 'closing' && currentSlide === 6) {
      return (
        <div className={styles.closingSlide}>
          <div className={styles.closingContent}>
            <div className={styles.closingQuote}>
              <p className={styles.quoteText}>&quot;{deck.closingQuote}&quot;</p>
            </div>
            <div className={styles.closingFooter}>
              <h2 className={styles.closingTitle}>¿Preguntas?</h2>
              <p className={styles.closingSubtitle}>Gracias por su atención</p>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  if (quizMode) {
    const totalQuestions = quizQuestions.length
    const answeredCount = Object.keys(quizAnswers).length
    const ratio = score / totalQuestions

    return (
      <div ref={containerRef} className={styles.quizFullScreen}>
        <header className={styles.quizFullHeader}>
          <div className={styles.quizFullTitleGroup}>
            <span className={styles.quizFullBadge}>Dinámica</span>
            <h1 className={styles.quizFullTitle}>
              Preguntas rápidas - {deck.name} (Tríada CIA)
            </h1>
          </div>
          <div className={styles.quizFullActions}>
            <button onClick={toggleFullscreen} className={styles.quizActionBtn}>
              {isFullscreen ? (
                <>
                  <Minimize size={16} /> Salir de pantalla completa
                </>
              ) : (
                <>
                  <Maximize size={16} /> Pantalla completa
                </>
              )}
            </button>
            <button onClick={resetQuiz} className={styles.quizActionBtn}>
              <RotateCcw size={16} /> Reiniciar
            </button>
            <button onClick={exitQuizMode} className={styles.quizExitBtn}>
              <ArrowLeft size={16} /> Volver a presentación
            </button>
          </div>
        </header>

        <main className={styles.quizFullBody}>
          {!showResults ? (
            <div className={styles.quizFullQuestions}>
              <div className={styles.quizProgress}>
                <span>
                  {answeredCount}/{totalQuestions} respondidas
                </span>
                <span>Mejor: {bestScore}/{totalQuestions}</span>
              </div>
              {quizQuestions.map((q, index) => (
                <div key={q.id} className={styles.quizFullCard}>
                  <div className={styles.quizFullCardHeader}>
                    <span className={styles.quizFullQuestionNumber}>Pregunta {index + 1}</span>
                  </div>
                  <p className={styles.quizFullQuestionText}>{q.question}</p>
                  <div className={styles.quizFullOptionsGrid}>
                    {q.options.map((option) => {
                      const isSelected = quizAnswers[q.id] === option.letter
                      const isCorrect = option.letter === q.correctAnswer
                      const showFeedback = showExplanation === q.id

                      return (
                        <button
                          key={option.letter}
                          onClick={() => handleAnswerSelect(q.id, option.letter)}
                          className={`${styles.quizFullOptionBtn} ${
                            isSelected ? styles.quizFullOptionSelected : ''
                          } ${showFeedback && isCorrect ? styles.quizFullOptionCorrect : ''} ${
                            showFeedback && isSelected && !isCorrect
                              ? styles.quizFullOptionIncorrect
                              : ''
                          }`}
                          disabled={showResults}
                        >
                          <span className={styles.quizFullOptionLetter}>{option.letter})</span>
                          <span className={styles.quizFullOptionText}>{option.text}</span>
                          {showFeedback && isCorrect && (
                            <span className={styles.quizCheckmark}>
                              <Check size={20} />
                            </span>
                          )}
                          {showFeedback && isSelected && !isCorrect && (
                            <span className={styles.quizCrossmark}>
                              <X size={20} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {showExplanation === q.id && (
                    <div
                      className={`${styles.quizFullExplanation} ${
                        quizAnswers[q.id] === q.correctAnswer
                          ? styles.quizFullExplanationCorrect
                          : styles.quizFullExplanationIncorrect
                      }`}
                    >
                      <strong>
                        {quizAnswers[q.id] === q.correctAnswer ? '¡Correcto!' : 'Incorrecto'}
                      </strong>
                      <p>
                        <strong>Respuesta: {q.correctAnswer}.</strong> {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {answeredCount === totalQuestions && (
                <button onClick={() => setShowResults(true)} className={styles.quizFullShowResults}>
                  Ver resultados
                </button>
              )}
            </div>
          ) : (
            <div className={styles.quizFullResults}>
              <div className={styles.quizFullResultsCard}>
                <h2 className={styles.quizFullResultsTitle}>Resultados</h2>
                <div className={styles.quizFullScoreCircle}>
                  <span className={styles.quizFullScoreNumber}>{score}</span>
                  <span className={styles.quizFullScoreTotal}>/ {totalQuestions}</span>
                </div>
                <p className={styles.quizFullScoreMessage}>
                  {ratio === 1 && '¡Excelente! Dominaste el tema.'}
                  {ratio >= 0.8 && ratio < 1 && '¡Muy bien! Casi perfecto.'}
                  {ratio >= 0.6 && ratio < 0.8 && 'Bien. Puedes repasar un poco más.'}
                  {ratio >= 0.4 && ratio < 0.6 && 'Necesitas repasar los conceptos.'}
                  {ratio < 0.4 && 'Revisa la presentación nuevamente.'}
                </p>
                <p className={styles.quizFullBestScore}>
                  Mejor resultado guardado: {bestScore} / {totalQuestions}
                </p>
                <div className={styles.quizFullResultsActions}>
                  <button onClick={resetQuiz} className={styles.quizFullResetBtn}>
                    Reiniciar dinámica
                  </button>
                  <button onClick={exitQuizMode} className={styles.quizFullBackBtn}>
                    Volver a presentación
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={styles.presentationContainer}>
      <div className={styles.topBar}>
        <Link to="/" className={styles.homeLink}>
          <ArrowLeft size={16} /> Inicio
        </Link>
        <div className={styles.topActions}>
          <button onClick={toggleFullscreen} className={styles.topBarBtn}>
            {isFullscreen ? (
              <>
                <Minimize size={16} /> Salir pantalla completa
              </>
            ) : (
              <>
                <Maximize size={16} /> Pantalla completa (F)
              </>
            )}
          </button>
          <button onClick={enterQuizMode} className={styles.topBarQuizBtn}>
            <HelpCircle size={16} /> Modo Preguntas
          </button>
        </div>
      </div>

      <div className={styles.deckProgress} aria-hidden="true">
        <span style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }} />
      </div>

      <div className={styles.slideWrapper}>{renderSlide()}</div>

      <div className={styles.navigation}>
        <button
          onClick={goToPrev}
          disabled={isFirstSlide}
          className={`${styles.navButton} ${isFirstSlide ? styles.navButtonDisabled : ''}`}
          aria-label="Diapositiva anterior"
        >
          <ChevronLeft size={18} /> Anterior
        </button>
        <div className={styles.slideIndicator}>
          <span className={styles.currentSlideNum}>{currentSlide + 1}</span>
          <span className={styles.totalSlideNum}>/ {totalSlides}</span>
        </div>
        <button
          onClick={goToNext}
          disabled={isLastSlide}
          className={`${styles.navButton} ${isLastSlide ? styles.navButtonDisabled : ''}`}
          aria-label="Siguiente diapositiva"
        >
          Siguiente <ChevronRight size={18} />
        </button>
      </div>

      <div className={styles.slideDots}>
        {slideTypes.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`${styles.dot} ${index === currentSlide ? styles.dotActive : ''}`}
            aria-label={`Ir a diapositiva ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
