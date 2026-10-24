import { Link } from 'react-router-dom'
import { BookOpen, Gamepad2, Presentation, Shield } from 'lucide-react'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.homeContainer}>
      <header className={styles.hero}>
        <div className={styles.heroBadge}>
          <Shield size={18} />
          <span>Seguridad de la Información</span>
        </div>
        <h1 className={styles.heroTitle}>Tríada CIA</h1>
        <p className={styles.heroSubtitle}>
          Confidencialidad, Integridad y Disponibilidad. Aprende, practica y juega con los tres pilares
          fundamentales de la seguridad de la información.
        </p>
      </header>

      <main className={styles.cardsGrid}>
        <Link to="/presentacion/disponibilidad" className={styles.card}>
          <div className={styles.cardIcon}>
            <Presentation size={32} />
          </div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Presentación: Disponibilidad</h2>
            <p className={styles.cardDescription}>
              Diapositivas interactivas con ejemplos, amenazas, medidas de protección y preguntas para
              reforzar el aprendizaje.
            </p>
            <div className={styles.cardFooter}>
              <span className={styles.cardLinkText}>Ver presentación</span>
              <BookOpen size={18} />
            </div>
          </div>
        </Link>

        <Link to="/juego" className={styles.card}>
          <div className={styles.cardIcon}>
            <Gamepad2 size={32} />
          </div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Juego: Tríada CIA</h2>
            <p className={styles.cardDescription}>
              Pon a prueba tus conocimientos con un juego interactivo sobre los tres pilares de la
              tríada CIA.
            </p>
            <div className={styles.cardFooter}>
              <span className={styles.cardLinkText}>Jugar ahora</span>
              <Gamepad2 size={18} />
            </div>
          </div>
        </Link>
      </main>

      <footer className={styles.footer}>
        <p>Aprende seguridad de la información de forma interactiva</p>
      </footer>
    </div>
  )
}
