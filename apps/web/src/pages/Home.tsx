import { Link } from 'react-router-dom'
import { BookOpen, FileCheck, Gamepad2, LockKeyhole, Rocket, Server, Shield } from 'lucide-react'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.navbar}>
        <Link to="/" className={styles.brand} aria-label="Tríada CIA, inicio">
          <span className={styles.brandMark}>
            <Shield size={17} />
          </span>
          <span className={styles.brandName}>
            Tríada <strong>CIA</strong>
          </span>
        </Link>
        <span className={styles.navMeta}>Laboratorio interactivo</span>
      </header>

      <header className={styles.hero}>
        <div className={styles.heroBadge}>
          <Shield size={16} />
          <span>Seguridad de la Información</span>
        </div>
        <h1 className={styles.heroTitle}>
          Tríada <span>CIA</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Confidencialidad, Integridad y Disponibilidad. Aprende, practica y juega con los tres
          pilares fundamentales de la seguridad de la información.
        </p>
        <div className={styles.heroMeta} aria-label="Contenido disponible">
          <span>3 pilares</span>
          <span>3 presentaciones</span>
          <span>4 quizzes</span>
          <span>1 arcade</span>
        </div>
      </header>

      <main className={styles.cardsGrid}>
        <Link
          to="/presentacion/confidencialidad"
          className={`${styles.card} ${styles.cardCyan}`}
        >
          <div className={styles.cardIcon}>
            <LockKeyhole size={26} />
          </div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Presentación: Confidencialidad</h2>
            <p className={styles.cardDescription}>
              Protege la información sensible y aprende quién debería tener acceso a cada dato.
            </p>
            <div className={styles.cardFooter}>
              <span className={styles.cardLinkText}>Ver presentación</span>
              <BookOpen size={18} />
            </div>
          </div>
        </Link>

        <Link
          to="/presentacion/integridad"
          className={`${styles.card} ${styles.cardAmber}`}
        >
          <div className={styles.cardIcon}>
            <FileCheck size={26} />
          </div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Presentación: Integridad</h2>
            <p className={styles.cardDescription}>
              Mantén los datos exactos, completos y libres de modificaciones no autorizadas.
            </p>
            <div className={styles.cardFooter}>
              <span className={styles.cardLinkText}>Ver presentación</span>
              <BookOpen size={18} />
            </div>
          </div>
        </Link>

        <Link
          to="/presentacion/disponibilidad"
          className={`${styles.card} ${styles.cardRose}`}
        >
          <div className={styles.cardIcon}>
            <Server size={26} />
          </div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Presentación: Disponibilidad</h2>
            <p className={styles.cardDescription}>
              Garantiza que los sistemas y la información estén accesibles cuando se necesiten.
            </p>
            <div className={styles.cardFooter}>
              <span className={styles.cardLinkText}>Ver presentación</span>
              <BookOpen size={18} />
            </div>
          </div>
        </Link>

        <Link to="/juego" className={`${styles.card} ${styles.cardBlue}`}>
          <div className={styles.cardIcon}>
            <Gamepad2 size={26} />
          </div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Quiz: Tríada CIA</h2>
            <p className={styles.cardDescription}>
              Pon a prueba tus conocimientos en seis escenarios. Tu progreso y mejor puntaje se
              guardan automáticamente.
            </p>
            <div className={styles.cardFooter}>
              <span className={styles.cardLinkText}>Jugar quiz</span>
              <Gamepad2 size={18} />
            </div>
          </div>
        </Link>

        <Link
          to="/juego/cyber-invaders"
          className={`${styles.card} ${styles.cardViolet} ${styles.cardWide}`}
        >
          <div className={styles.cardIcon}>
            <Rocket size={26} />
          </div>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Cyber Invaders: Infinite Pulse</h2>
            <p className={styles.cardDescription}>
              Arcade tipo Space Invaders con temática de la Tríada CIA. Modo Historia e Infinito,
              jefe Tux, música local y análisis CIA en tiempo real. Tu mejor marca se conserva.
            </p>
            <div className={styles.cardFooter}>
              <span className={styles.cardLinkText}>Jugar Cyber Invaders</span>
              <Rocket size={18} />
            </div>
          </div>
        </Link>
      </main>

      <footer className={styles.footer}>
        <p>Aprende seguridad de la información de forma interactiva</p>
        <span className={styles.footerDot} aria-hidden="true" />
        <span>Seguridad de la Información</span>
      </footer>
    </div>
  )
}
