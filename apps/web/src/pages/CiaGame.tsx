import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, RefreshCw, Shield, XCircle } from 'lucide-react'
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, Pillar>>({})
  const [showFeedback, setShowFeedback] = useState(false)
  const [finished, setFinished] = useState(false)

  const currentQuestion = questions[currentIndex]
  const selected = answers[currentQuestion.id]

  const resolvedCorrect =
    currentQuestion.options.find((o) => {
      if (currentQuestion.id === 1) return o.pillar === 'confidencialidad'
      if (currentQuestion.id === 2) return o.pillar === 'integridad'
      if (currentQuestion.id === 3) return o.pillar === 'disponibilidad'
      if (currentQuestion.id === 4) return o.pillar === 'confidencialidad'
      if (currentQuestion.id === 5) return o.pillar === 'integridad'
      if (currentQuestion.id === 6) return o.pillar === 'disponibilidad'
      return o.letter === 'A'
    })?.pillar ?? currentQuestion.options[0].pillar

  const isCorrect = selected === resolvedCorrect

  const score = useMemo(() => {
    return questions.reduce((acc, q) => {
      if (answers[q.id] === getCorrectPillar(q)) acc += 1
      return acc
    }, 0)
  }, [answers])

  function getCorrectPillar(q: Question): Pillar {
    if (q.id === 1 || q.id === 4) return 'confidencialidad'
    if (q.id === 2 || q.id === 5) return 'integridad'
    if (q.id === 3 || q.id === 6) return 'disponibilidad'
    return q.options[0].pillar
  }

  const handleSelect = (pillar: Pillar) => {
    if (showFeedback) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: pillar }))
    setShowFeedback(true)
  }

  const goNext = () => {
    if (currentIndex === questions.length - 1) {
      setFinished(true)
      return
    }
    setCurrentIndex((prev) => prev + 1)
    setShowFeedback(false)
  }

  const restart = () => {
    setCurrentIndex(0)
    setAnswers({})
    setShowFeedback(false)
    setFinished(false)
  }

  if (finished) {
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
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={18} /> Inicio
        </Link>
        <div className={styles.progressInfo}>
          <span>
            Pregunta {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className={styles.pillarLegend}>
          <span style={{ color: '#60a5fa' }}>C</span> Confidencialidad ·{' '}
          <span style={{ color: '#22d3ee' }}>I</span> Integridad ·{' '}
          <span style={{ color: '#34d399' }}>D</span> Disponibilidad
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
              const showState = showFeedback

              return (
                <button
                  key={option.letter}
                  onClick={() => handleSelect(option.pillar)}
                  className={`${styles.optionCard} ${
                    isSelected ? styles.optionSelected : ''
                  } ${showState && correct ? styles.optionCorrect : ''} ${
                    showState && isSelected && !correct ? styles.optionWrong : ''
                  }`}
                  disabled={showFeedback}
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

          {showFeedback && (
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
