import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Maximize,
  Minimize,
  RotateCcw,
  Server,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react'
import styles from './DisponibilidadCiaPresentation.module.css'

type Slide = {
  id: number
  type: 'cover' | 'content' | 'table' | 'quiz' | 'closing'
}

const slides: Slide[] = [
  { id: 1, type: 'cover' },
  { id: 2, type: 'content' },
  { id: 3, type: 'content' },
  { id: 4, type: 'content' },
  { id: 5, type: 'content' },
  { id: 6, type: 'table' },
  { id: 7, type: 'closing' },
]

const quizQuestions = [
  {
    id: 1,
    question:
      'Si una página web está caída y los estudiantes no pueden inscribirse, ¿qué principio de la tríada CIA se vio afectado?',
    options: [
      { letter: 'A', text: 'Confidencialidad' },
      { letter: 'B', text: 'Integridad' },
      { letter: 'C', text: 'Disponibilidad' },
      { letter: 'D', text: 'Ninguno' },
    ],
    correctAnswer: 'C',
    explanation:
      'La información existe, pero no se puede acceder a ella cuando se necesita.',
  },
  {
    id: 2,
    question: '¿Cuál de estas acciones ayuda más a mantener la disponibilidad?',
    options: [
      { letter: 'A', text: 'Ocultar contraseñas' },
      { letter: 'B', text: 'Hacer copias de seguridad y tener un servidor de respaldo' },
      { letter: 'C', text: 'Cambiar los datos sin permiso' },
      { letter: 'D', text: 'Compartir información pública con todos' },
    ],
    correctAnswer: 'B',
    explanation:
      'Las copias de seguridad y los sistemas de respaldo permiten recuperar el acceso tras una falla.',
  },
  {
    id: 3,
    question:
      'Un atacante envía tantas solicitudes a una web que esta se vuelve lenta o deja de responder. ¿Qué está atacando?',
    options: [
      { letter: 'A', text: 'La disponibilidad' },
      { letter: 'B', text: 'La confidencialidad' },
      { letter: 'C', text: 'La integridad' },
      { letter: 'D', text: 'La estética del sitio' },
    ],
    correctAnswer: 'A',
    explanation:
      'Está buscando impedir que los usuarios autorizados usen el servicio (ataque de denegación de servicio).',
  },
  {
    id: 4,
    question: '¿Qué situación representa una pérdida de disponibilidad?',
    options: [
      { letter: 'A', text: 'Alguien lee mensajes privados de otra persona' },
      { letter: 'B', text: 'Un archivo cambia sin autorización' },
      { letter: 'C', text: 'El sistema de pagos no funciona durante varias horas' },
      { letter: 'D', text: 'Un usuario olvida su contraseña' },
    ],
    correctAnswer: 'C',
    explanation: 'El servicio no está accesible cuando debería estarlo.',
  },
  {
    id: 5,
    question:
      '¿Cuál es la mejor forma de completar la frase? "La disponibilidad busca que la información esté…" ',
    options: [
      { letter: 'A', text: 'Secreta para todos' },
      { letter: 'B', text: 'Correcta y sin cambios' },
      { letter: 'C', text: 'Accesible cuando se necesite' },
      { letter: 'D', text: 'Guardada solo en papel' },
    ],
    correctAnswer: 'C',
    explanation: 'Es el acceso oportuno y confiable a la información o al sistema.',
  },
]

export default function DisponibilidadCiaPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [showExplanation, setShowExplanation] = useState<number | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [quizMode, setQuizMode] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalSlides = slides.length
  const isFirstSlide = currentSlide === 0
  const isLastSlide = currentSlide === totalSlides - 1

  const goToNext = () => {
    if (!isLastSlide) {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  const goToPrev = () => {
    if (!isFirstSlide) {
      setCurrentSlide((prev) => prev - 1)
    }
  }

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

  const calculateScore = () => {
    let correct = 0
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correct++
      }
    })
    return correct
  }

  const resetQuiz = () => {
    setQuizAnswers({})
    setShowResults(false)
    setShowExplanation(null)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen()
      } else if (document.exitFullscreen) {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Error al cambiar a pantalla completa:', err)
    }
  }

  const enterQuizMode = () => {
    setQuizMode(true)
    setQuizAnswers({})
    setShowResults(false)
    setShowExplanation(null)
  }

  const exitQuizMode = () => {
    setQuizMode(false)
    setQuizAnswers({})
    setShowResults(false)
    setShowExplanation(null)
  }

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
  }, [currentSlide, quizMode])

  const renderSlide = () => {
    const slideType = slides[currentSlide].type

    if (slideType === 'cover') {
      return (
        <div className={styles.coverSlide}>
          <div className={styles.coverContent}>
            <div className={styles.badge}>Tríada CIA</div>
            <h1 className={styles.coverTitle}>Disponibilidad</h1>
            <p className={styles.coverSubtitle}>
              Asegurando el acceso oportuno y confiable a la información
            </p>
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
              <li>Definir qué es la disponibilidad dentro de la tríada CIA</li>
              <li>Identificar ejemplos cotidianos donde se aplica</li>
              <li>Reconocer amenazas que pueden afectarla</li>
              <li>Conocer medidas para protegerla</li>
              <li>Aplicar lo aprendido mediante una dinámica interactiva</li>
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
            <h2 className={styles.slideTitle}>¿Qué es la disponibilidad?</h2>
          </header>
          <div className={styles.slideBody}>
            <div className={styles.definitionBox}>
              <p className={styles.definitionText}>
                La <strong>disponibilidad</strong> es el pilar de la tríada CIA que asegura que
                las personas autorizadas puedan usar la información, los sistemas o los
                servicios <strong>cuando los necesiten</strong>, sin interrupciones innecesarias.
              </p>
            </div>
            <div className={styles.analogyBox}>
              <h3 className={styles.analogyTitle}>
                <Lightbulb size={20} />
                <span>Analogía</span>
              </h3>
              <p>
                Imagina una tienda web: no basta con que las contraseñas estén protegidas
                (<em>confidencialidad</em>) ni con que los precios y datos estén correctos
                (<em>integridad</em>). También debe poder abrirse y funcionar cuando un cliente
                quiera comprar. Esa capacidad de estar &quot;lista para usarse&quot; es la
                disponibilidad.
              </p>
            </div>
            <div className={styles.keyPhrase}>
              <p>
                <strong>Definición fácil:</strong> Disponibilidad es que el sistema, la aplicación
                o los datos estén accesibles y funcionando para quienes tienen permiso de usarlos.
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
              <div className={styles.exampleCard}>
                <div className={styles.exampleIcon}>
                  <Server size={28} />
                </div>
                <h3>Cajero automático</h3>
                <p>Funciona cuando necesitas retirar dinero</p>
              </div>
              <div className={styles.exampleCard}>
                <div className={styles.exampleIcon}>
                  <BookOpen size={28} />
                </div>
                <h3>Matrícula universitaria</h3>
                <p>Abre durante el periodo de inscripción</p>
              </div>
              <div className={styles.exampleCard}>
                <div className={styles.exampleIcon}>
                  <Zap size={28} />
                </div>
                <h3>App de mensajería</h3>
                <p>Permite enviar mensajes sin caerse</p>
              </div>
              <div className={styles.exampleCard}>
                <div className={styles.exampleIcon}>
                  <ShieldCheck size={28} />
                </div>
                <h3>Sistema hospitalario</h3>
                <p>Permite consultar recetas o citas en el momento necesario</p>
              </div>
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
              <li>
                <span className={styles.threatIcon}>
                  <AlertTriangle size={22} />
                </span>
                <div>
                  <strong>Fallo técnico</strong> - Caída del servidor o fallo de internet
                </div>
              </li>
              <li>
                <span className={styles.threatIcon}>
                  <Zap size={22} />
                </span>
                <div>
                  <strong>Corte de energía</strong> - Sin electricidad no hay servicio
                </div>
              </li>
              <li>
                <span className={styles.threatIcon}>
                  <Server size={22} />
                </span>
                <div>
                  <strong>Saturación</strong> - Demasiados usuarios al mismo tiempo
                </div>
              </li>
              <li>
                <span className={styles.threatIcon}>
                  <AlertTriangle size={22} />
                </span>
                <div>
                  <strong>Ataques</strong> - Alguien satura el sistema e impide el acceso
                </div>
              </li>
              <li>
                <span className={styles.threatIcon}>
                  <HelpCircle size={22} />
                </span>
                <div>
                  <strong>Falta de preparación</strong> - Sin copias de seguridad o plan de
                  recuperación
                </div>
              </li>
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
                  <tr>
                    <td className={styles.measureName}>Copias de seguridad</td>
                    <td>Guardar una copia de la información por si algo se pierde.</td>
                  </tr>
                  <tr>
                    <td className={styles.measureName}>Equipos de respaldo</td>
                    <td>Tener otro servidor o servicio listo si el principal falla.</td>
                  </tr>
                  <tr>
                    <td className={styles.measureName}>Mantenimiento</td>
                    <td>Revisar y actualizar los sistemas antes de que fallen.</td>
                  </tr>
                  <tr>
                    <td className={styles.measureName}>Planes de recuperación</td>
                    <td>Saber qué hacer si la página o el sistema se cae.</td>
                  </tr>
                  <tr>
                    <td className={styles.measureName}>Protección contra ataques</td>
                    <td>Evitar que alguien sature el servicio y lo deje inaccesible.</td>
                  </tr>
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
              <p className={styles.quoteText}>
                &quot;La disponibilidad no solo significa tener datos guardados; significa
                poder usarlos cuando realmente los necesitas.&quot;
              </p>
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
    const score = calculateScore()
    const totalQuestions = quizQuestions.length
    const answeredCount = Object.keys(quizAnswers).length

    return (
      <div ref={containerRef} className={styles.quizFullScreen}>
        <header className={styles.quizFullHeader}>
          <div className={styles.quizFullTitleGroup}>
            <span className={styles.quizFullBadge}>Dinámica</span>
            <h1 className={styles.quizFullTitle}>Preguntas rápidas - Disponibilidad (Tríada CIA)</h1>
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
                  {score === 5 && '¡Excelente! Dominaste el tema.'}
                  {score === 4 && '¡Muy bien! Casi perfecto.'}
                  {score === 3 && 'Bien. Puedes repasar un poco más.'}
                  {score === 2 && 'Necesitas repasar los conceptos.'}
                  {score <= 1 && 'Revisa la presentación nuevamente.'}
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
        {slides.map((_, index) => (
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
