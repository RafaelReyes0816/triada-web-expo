import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, RefreshCw, Shield, XCircle } from 'lucide-react'
import { useBestScore, usePersistentState } from '../hooks/usePersistentState'
import styles from './CiaGame.module.css'

type Pillar = 'confidencialidad' | 'integridad' | 'disponibilidad'

type Question = {
  id: number
  scenario: string
  options: {
    letter: 'A' | 'B' | 'C'
    text: string
    pillar: Pillar
  }[]
  explanation: string
}

type QuizProgress = {
  currentIndex: number
  answers: Record<number, Pillar>
  showFeedback: boolean
  finished: boolean
}

const initialProgress: QuizProgress = {
  currentIndex: 0,
  answers: {},
  showFeedback: false,
  finished: false,
}

const questions: Question[] = [
  {
    id: 1,
    scenario:
      'Un atacante intercepta las credenciales enviadas sin cifrado entre el usuario y el sitio web.',
    options: [
      { letter: 'A', text: 'Confidencialidad', pillar: 'confidencialidad' },
      { letter: 'B', text: 'Integridad', pillar: 'integridad' },
      { letter: 'C', text: 'Disponibilidad', pillar: 'disponibilidad' },
    ],
    explanation:
      'Se compromete la confidencialidad, ya que la información privada es visible para terceros.',
  },
  {
    id: 2,
    scenario:
      'Alguien modifica sin autorización el monto de una transferencia bancaria antes de que sea procesada.',
    options: [
      { letter: 'A', text: 'Confidencialidad', pillar: 'confidencialidad' },
      { letter: 'B', text: 'Integridad', pillar: 'integridad' },
      { letter: 'C', text: 'Disponibilidad', pillar: 'disponibilidad' },
    ],
    explanation:
      'La integridad se ve afectada porque los datos han sido alterados sin autorización.',
  },
  {
    id: 3,
    scenario:
      'Un ataque de denegación de servicio deja inaccesible la página de inscripciones por varias horas.',
    options: [
      { letter: 'A', text: 'Confidencialidad', pillar: 'confidencialidad' },
      { letter: 'B', text: 'Integridad', pillar: 'integridad' },
      { letter: 'C', text: 'Disponibilidad', pillar: 'disponibilidad' },
    ],
    explanation: 'La disponibilidad se pierde cuando los usuarios autorizados no pueden acceder al servicio.',
  },
  {
    id: 4,
    scenario:
      'Se filtran historiales médicos de pacientes a un sitio público sin su consentimiento.',
    options: [
      { letter: 'A', text: 'Confidencialidad', pillar: 'confidencialidad' },
      { letter: 'B', text: 'Integridad', pillar: 'integridad' },
      { letter: 'C', text: 'Disponibilidad', pillar: 'disponibilidad' },
    ],
    explanation: 'Es un caso claro de pérdida de confidencialidad.',
  },
  {
    id: 5,
    scenario:
      'Un virus modifica archivos del sistema cambiando configuraciones críticas sin permiso.',
    options: [
      { letter: 'A', text: 'Confidencialidad', pillar: 'confidencialidad' },
      { letter: 'B', text: 'Integridad', pillar: 'integridad' },
      { letter: 'C', text: 'Disponibilidad', pillar: 'disponibilidad' },
    ],
    explanation: 'Se afecta la integridad al alterar información o configuraciones.',
  },
  {
    id: 6,
    scenario: 'Un fallo en el centro de datos deja fuera de servicio el sistema de nómina el día de pago.',
    options: [
      { letter: 'A', text: 'Confidencialidad', pillar: 'confidencialidad' },
      { letter: 'B', text: 'Integridad', pillar: 'integridad' },
      { letter: 'C', text: 'Disponibilidad', pillar: 'disponibilidad' },
    ],
    explanation: 'El acceso oportuno al servicio se ve comprometido, afectando la disponibilidad.',
  },
]

export default function CiaGame() {
  const [storedProgress, setProgress] = usePersistentState<QuizProgress>(
    'triada:quiz:progreso',
    initialProgress,
  )
  const progress =
    storedProgress &&
    typeof storedProgress === 'object' &&
    storedProgress.answers &&
    typeof storedProgress.answers === 'object'
      ? storedProgress
      : initialProgress
  const [bestScore, saveBestScore] = useBestScore('triada:quiz:mejor-puntaje')
  const storedIndex = Number(progress.currentIndex)
  const currentIndex = Number.isFinite(storedIndex)
    ? Math.min(Math.max(Math.trunc(storedIndex), 0), questions.length - 1)
    : 0
  const currentQuestion = questions[currentIndex]
  const selected = progress.answers[currentQuestion.id]
  const resolvedCorrect = getCorrectPillar(currentQuestion)
  const isCorrect = selected === resolvedCorrect

  const score = useMemo(() => {
    return questions.reduce((acc, q) => {
      if (progress.answers[q.id] === getCorrectPillar(q)) acc += 1
      return acc
    }, 0)
  }, [progress.answers])

  useEffect(() => {
    if (progress.finished) saveBestScore(score)
  }, [progress.finished, saveBestScore, score])

  function getCorrectPillar(q: Question): Pillar {
    if (q.id === 1 || q.id === 4) return 'confidencialidad'
    if (q.id === 2 || q.id === 5) return 'integridad'
    if (q.id === 3 || q.id === 6) return 'disponibilidad'
    return q.options[0].pillar
  }

  const handleSelect = (pillar: Pillar) => {
    if (progress.showFeedback) return
    setProgress({
      ...progress,
      answers: { ...progress.answers, [currentQuestion.id]: pillar },
      showFeedback: true,
    })
  }

  const goNext = () => {
    if (currentIndex === questions.length - 1) {
      setProgress({ ...progress, finished: true })
      return
    }
    setProgress({
      ...progress,
      currentIndex: currentIndex + 1,
      showFeedback: false,
    })
  }

  const restart = () => {
    setProgress({ ...initialProgress, answers: {} })
  }

  if (progress.finished) {
    return (
      <div className={styles.gameContainer}>
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <Shield size={40} />
            <h1>Resultados</h1>
          </div>
          <div className={styles.scoreDisplay}>
            <span className={styles.scoreNumber}>{score}</span>
            <span className={styles.scoreTotal}>/ {questions.length}</span>
          </div>
          <p className={styles.resultMessage}>
            {score === questions.length && '¡Perfecto! Dominas los tres pilares de la tríada CIA.'}
            {score >= questions.length - 1 && score < questions.length && '¡Muy bien! Casi lo logras.'}
            {score >= Math.ceil(questions.length / 2) && score < questions.length - 1 && 'Buen trabajo. Repasa un poco los conceptos.'}
            {score < Math.ceil(questions.length / 2) && 'Sigue practicando para dominar la tríada CIA.'}
          </p>
          <p className={styles.bestScore}>Mejor resultado guardado: {bestScore} / {questions.length}</p>
          <div className={styles.resultActions}>
            <button onClick={restart} className={styles.actionBtnPrimary}>
              <RefreshCw size={18} /> Jugar de nuevo
            </button>
            <Link to="/" className={styles.actionBtnSecondary}>
              <ArrowLeft size={18} /> Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.gameContainer}>
      <header className={styles.gameHeader}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={18} /> Inicio
          </Link>
          <div className={styles.progressInfo}>
            <div className={styles.progressText}>
              <span>
                Pregunta {currentIndex + 1} de {questions.length}
              </span>
              <span className={styles.progressPercent}>
                {Math.round(((currentIndex + 1) / questions.length) * 100)}%
              </span>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="Progreso del quiz"
              aria-valuemin={1}
              aria-valuemax={questions.length}
              aria-valuenow={currentIndex + 1}
            >
              <span
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          <div className={styles.pillarLegend} aria-label="Pilares de la tríada CIA">
            <span className={styles.legendItem}>
              <i className={`${styles.legendDot} ${styles.legendC}`} />
              Confidencialidad
            </span>
            <span className={styles.legendItem}>
              <i className={`${styles.legendDot} ${styles.legendI}`} />
              Integridad
            </span>
            <span className={styles.legendItem}>
              <i className={`${styles.legendDot} ${styles.legendD}`} />
              Disponibilidad
            </span>
          </div>
        </div>
      </header>

      <main className={styles.gameMain}>
        <div className={styles.questionCard}>
          <div className={styles.questionLabel}>Escenario</div>
          <p className={styles.scenarioText}>{currentQuestion.scenario}</p>

          <div className={styles.optionsGrid}>
            {currentQuestion.options.map((option) => {
              const isSelected = selected === option.pillar
              const correct = option.pillar === resolvedCorrect
              const showState = progress.showFeedback

              return (
                <button
                  key={option.letter}
                  onClick={() => handleSelect(option.pillar)}
                  className={`${styles.optionCard} ${
                    isSelected ? styles.optionSelected : ''
                  } ${showState && correct ? styles.optionCorrect : ''} ${
                    showState && isSelected && !correct ? styles.optionWrong : ''
                  }`}
                  disabled={progress.showFeedback}
                >
                  <div className={styles.optionHeader}>
                    <span className={styles.optionLetter}>{option.letter}</span>
                    <span className={styles.optionName}>{option.text}</span>
                  </div>
                  {showState && correct && <CheckCircle2 size={22} className={styles.statusIcon} />}
                  {showState && isSelected && !correct && <XCircle size={22} className={styles.statusIcon} />}
                </button>
              )
            })}
          </div>

          {progress.showFeedback && (
            <div className={`${styles.feedbackBox} ${isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}>
              <div className={styles.feedbackHeader}>
                {isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                <span>{isCorrect ? '¡Correcto!' : 'Incorrecto'}</span>
              </div>
              <p className={styles.feedbackText}>{currentQuestion.explanation}</p>
              <button onClick={goNext} className={styles.nextQuestionBtn}>
                {currentIndex === questions.length - 1 ? 'Ver resultados' : 'Siguiente pregunta'}{' '}
                <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
