export type PresentationIcon =
  | 'server'
  | 'book'
  | 'zap'
  | 'shield'
  | 'alert'
  | 'help'
  | 'lock'
  | 'key'
  | 'eyeOff'
  | 'database'
  | 'clock'
  | 'wifiOff'
  | 'userCheck'
  | 'share'
  | 'bug'
  | 'fileCheck'

export type PresentationOption = {
  letter: 'A' | 'B' | 'C' | 'D'
  text: string
}

export type PresentationQuizQuestion = {
  id: number
  question: string
  options: PresentationOption[]
  correctAnswer: string
  explanation: string
}

export type CiaDeck = {
  id: 'confidencialidad' | 'integridad' | 'disponibilidad'
  name: string
  coverSubtitle: string
  objectives: string[]
  definition: string
  analogy: string
  keyPhrase: string
  examples: { icon: PresentationIcon; title: string; text: string }[]
  threats: { icon: PresentationIcon; title: string; text: string }[]
  protections: { measure: string; explanation: string }[]
  closingQuote: string
  quiz: PresentationQuizQuestion[]
}

export const presentationDecks: Record<CiaDeck['id'], CiaDeck> = {
  confidencialidad: {
    id: 'confidencialidad',
    name: 'Confidencialidad',
    coverSubtitle: 'Protegiendo la información contra accesos no autorizados',
    objectives: [
      'Definir qué es la confidencialidad dentro de la tríada CIA',
      'Identificar ejemplos cotidianos donde se aplica',
      'Reconocer amenazas que pueden afectarla',
      'Conocer medidas para protegerla',
      'Aplicar lo aprendido mediante una dinámica interactiva',
    ],
    definition:
      'es el pilar de la tríada CIA que garantiza que la información solo sea consultada, utilizada o compartida por personas, procesos o sistemas autorizados.',
    analogy:
      'Imagina que tu correo es un buzón privado. Aunque el buzón exista y las cartas estén completas, solo tú deberías tener la llave para abrirlo. La confidencialidad protege esa llave y evita que otras personas lean tus mensajes.',
    keyPhrase:
      'Confidencialidad es que la información correcta llegue únicamente a las personas correctas.',
    examples: [
      { icon: 'shield', title: 'Historial médico', text: 'Solo el personal autorizado puede consultarlo' },
      { icon: 'lock', title: 'Contraseña del correo', text: 'Protege el acceso a tu buzón personal' },
      { icon: 'key', title: 'Datos bancarios', text: 'No deben quedar visibles para terceros' },
      { icon: 'eyeOff', title: 'Conversación privada', text: 'Permanece reservada para sus participantes' },
    ],
    threats: [
      { icon: 'eyeOff', title: 'Interceptación', text: 'Alguien captura datos mientras viajan por la red' },
      { icon: 'key', title: 'Contraseñas débiles', text: 'Facilitan que un atacante acceda a una cuenta' },
      { icon: 'bug', title: 'Malware y espionaje', text: 'Programas maliciosos roban información privada' },
      { icon: 'share', title: 'Exposición accidental', text: 'Enviar un archivo al destinatario equivocado' },
      { icon: 'help', title: 'Permisos mal configurados', text: 'Dejan visibles datos que deberían ser privados' },
    ],
    protections: [
      { measure: 'Cifrado', explanation: 'Convertir los datos en un contenido ilegible sin la clave correcta.' },
      { measure: 'Contraseñas robustas y MFA', explanation: 'Combinar claves seguras con un segundo factor de verificación.' },
      { measure: 'Control de acceso', explanation: 'Dar a cada persona solo los permisos que realmente necesita.' },
      { measure: 'Capacitación contra phishing', explanation: 'Enseñar a reconocer mensajes y enlaces engañosos.' },
      { measure: 'Clasificación de la información', explanation: 'Definir qué datos son públicos, internos o reservados.' },
    ],
    closingQuote:
      'La confidencialidad no consiste en ocultar todo, sino en permitir que cada persona vea solo lo que le corresponde.',
    quiz: [
      {
        id: 1,
        question:
          'Un empleado comparte por error una hoja con datos personales de clientes en un grupo público. ¿Qué pilar se ve afectado?',
        options: [
          { letter: 'A', text: 'Confidencialidad' },
          { letter: 'B', text: 'Integridad' },
          { letter: 'C', text: 'Disponibilidad' },
          { letter: 'D', text: 'Ninguno' },
        ],
        correctAnswer: 'A',
        explanation: 'La información privada quedó visible para personas no autorizadas.',
      },
      {
        id: 2,
        question: '¿Cuál es una buena práctica para proteger la confidencialidad?',
        options: [
          { letter: 'A', text: 'Publicar las contraseñas del equipo' },
          { letter: 'B', text: 'Usar cifrado y control de acceso' },
          { letter: 'C', text: 'Compartir una sola cuenta entre todos' },
          { letter: 'D', text: 'Desactivar la autenticación' },
        ],
        correctAnswer: 'B',
        explanation: 'El cifrado y los permisos limitan el acceso a las personas autorizadas.',
      },
      {
        id: 3,
        question:
          'Un atacante intercepta una contraseña enviada sin cifrado. ¿Qué está comprometiendo?',
        options: [
          { letter: 'A', text: 'La disponibilidad' },
          { letter: 'B', text: 'La confidencialidad' },
          { letter: 'C', text: 'La integridad' },
          { letter: 'D', text: 'El rendimiento del sitio' },
        ],
        correctAnswer: 'B',
        explanation: 'La contraseña quedó expuesta a una persona que no estaba autorizada a conocerla.',
      },
      {
        id: 4,
        question: '¿Qué situación representa una pérdida de confidencialidad?',
        options: [
          { letter: 'A', text: 'Un archivo se corrompe' },
          { letter: 'B', text: 'El servidor se queda sin energía' },
          { letter: 'C', text: 'Historiales médicos visibles para personas no autorizadas' },
          { letter: 'D', text: 'Se actualiza el sistema operativo' },
        ],
        correctAnswer: 'C',
        explanation: 'La información sensible fue expuesta a quien no debía acceder a ella.',
      },
      {
        id: 5,
        question:
          '¿Cuál es la mejor forma de completar la frase? "La confidencialidad busca que la información…"',
        options: [
          { letter: 'A', text: 'Esté disponible para todos' },
          { letter: 'B', text: 'Sea exacta y sin cambios' },
          { letter: 'C', text: 'Solo sea accesible para quien está autorizado' },
          { letter: 'D', text: 'Se guarde únicamente en papel' },
        ],
        correctAnswer: 'C',
        explanation: 'Su objetivo es limitar el acceso a las personas, procesos o sistemas autorizados.',
      },
    ],
  },
  integridad: {
    id: 'integridad',
    name: 'Integridad',
    coverSubtitle: 'Manteniendo los datos exactos, completos y sin alteraciones',
    objectives: [
      'Definir qué es la integridad dentro de la tríada CIA',
      'Identificar ejemplos cotidianos donde se aplica',
      'Reconocer amenazas que pueden afectarla',
      'Conocer medidas para protegerla',
      'Aplicar lo aprendido mediante una dinámica interactiva',
    ],
    definition:
      'es el pilar de la tríada CIA que garantiza que la información sea exacta, completa y no haya sido modificada de forma accidental o no autorizada.',
    analogy:
      'Piensa en una receta médica: si alguien cambia la dosis, el documento sigue existiendo, pero ya no es confiable. La integridad asegura que la información conserve su contenido original y que cualquier cambio quede registrado.',
    keyPhrase:
      'Integridad es que los datos se mantengan exactos y completos, sin cambios no autorizados.',
    examples: [
      { icon: 'fileCheck', title: 'Transferencia bancaria', text: 'El monto y el destinatario no cambian' },
      { icon: 'book', title: 'Notas universitarias', text: 'Reflejan realmente el resultado obtenido' },
      { icon: 'shield', title: 'Historial clínico', text: 'Las indicaciones médicas no fueron alteradas' },
      { icon: 'database', title: 'Archivo de configuración', text: 'Conserva los valores definidos por el administrador' },
    ],
    threats: [
      { icon: 'alert', title: 'Modificación no autorizada', text: 'Alguien cambia datos sin permiso' },
      { icon: 'help', title: 'Errores humanos', text: 'Una digitación incorrecta altera la información' },
      { icon: 'bug', title: 'Malware', text: 'Un programa modifica archivos o configuraciones' },
      { icon: 'server', title: 'Fallos de hardware', text: 'Una falla puede corromper datos almacenados' },
      { icon: 'clock', title: 'Sincronización defectuosa', text: 'Una versión antigua sobrescribe la más reciente' },
    ],
    protections: [
      { measure: 'Firmas digitales y hashes', explanation: 'Permiten comprobar que un archivo no fue alterado.' },
      { measure: 'Control de versiones', explanation: 'Mantiene un historial de cambios y permite recuperar versiones anteriores.' },
      { measure: 'Registros de auditoría', explanation: 'Dejan evidencia de quién modificó cada dato y cuándo.' },
      { measure: 'Validación de datos', explanation: 'Revisan que los valores cumplan formato y reglas antes de guardarse.' },
      { measure: 'Copias verificadas', explanation: 'Permiten restaurar información sin introducir errores.' },
    ],
    closingQuote:
      'Un dato alterado puede parecer válido; la integridad garantiza que además sea confiable.',
    quiz: [
      {
        id: 1,
        question:
          'Alguien cambia sin autorización el monto de una transferencia bancaria antes de que sea procesada. ¿Qué pilar se afecta?',
        options: [
          { letter: 'A', text: 'Confidencialidad' },
          { letter: 'B', text: 'Integridad' },
          { letter: 'C', text: 'Disponibilidad' },
          { letter: 'D', text: 'Ninguno' },
        ],
        correctAnswer: 'B',
        explanation: 'Los datos fueron modificados sin autorización, por lo que dejaron de ser confiables.',
      },
      {
        id: 2,
        question: '¿Cuál medida ayuda a verificar que un archivo no fue alterado?',
        options: [
          { letter: 'A', text: 'Una firma digital o un hash' },
          { letter: 'B', text: 'Compartir la contraseña con todos' },
          { letter: 'C', text: 'Apagar el servidor' },
          { letter: 'D', text: 'Eliminar las copias de seguridad' },
        ],
        correctAnswer: 'A',
        explanation: 'La firma digital y el hash permiten comprobar la autenticidad e integridad del contenido.',
      },
      {
        id: 3,
        question:
          'Un error de digitación cambia la nota de un estudiante en el sistema. ¿Qué pilar presenta el problema?',
        options: [
          { letter: 'A', text: 'Integridad' },
          { letter: 'B', text: 'Confidencialidad' },
          { letter: 'C', text: 'Disponibilidad' },
          { letter: 'D', text: 'Ninguno' },
        ],
        correctAnswer: 'A',
        explanation: 'La información ya no representa el resultado real, aunque el sistema siga funcionando.',
      },
      {
        id: 4,
        question: '¿Qué situación representa una pérdida de integridad?',
        options: [
          { letter: 'A', text: 'Un usuario olvida su contraseña' },
          { letter: 'B', text: 'Se modifica un historial clínico sin autorización' },
          { letter: 'C', text: 'La página tarda en cargar' },
          { letter: 'D', text: 'Se bloquea una cuenta tras varios intentos' },
        ],
        correctAnswer: 'B',
        explanation: 'El contenido del historial fue alterado, por lo que ya no es exacto ni confiable.',
      },
      {
        id: 5,
        question:
          '¿Cuál es la mejor forma de completar la frase? "La integridad busca que la información…"',
        options: [
          { letter: 'A', text: 'Esté accesible cuando se necesite' },
          { letter: 'B', text: 'Sea secreta para todos' },
          { letter: 'C', text: 'Sea exacta y no haya sido alterada' },
          { letter: 'D', text: 'Esté duplicada en muchos lugares' },
        ],
        correctAnswer: 'C',
        explanation: 'La integridad protege la exactitud y la ausencia de modificaciones no autorizadas.',
      },
    ],
  },
  disponibilidad: {
    id: 'disponibilidad',
    name: 'Disponibilidad',
    coverSubtitle: 'Asegurando el acceso oportuno y confiable a la información',
    objectives: [
      'Definir qué es la disponibilidad dentro de la tríada CIA',
      'Identificar ejemplos cotidianos donde se aplica',
      'Reconocer amenazas que pueden afectarla',
      'Conocer medidas para protegerla',
      'Aplicar lo aprendido mediante una dinámica interactiva',
    ],
    definition:
      'es el pilar de la tríada CIA que asegura que las personas autorizadas puedan usar la información, los sistemas o los servicios cuando los necesiten, sin interrupciones innecesarias.',
    analogy:
      'Imagina una tienda web: no basta con que las contraseñas estén protegidas ni con que los precios estén correctos. También debe poder abrirse y funcionar cuando un cliente quiera comprar. Esa capacidad de estar lista para usarse es la disponibilidad.',
    keyPhrase:
      'Disponibilidad es que el sistema, la aplicación o los datos estén accesibles y funcionando para quienes tienen permiso de usarlos.',
    examples: [
      { icon: 'server', title: 'Cajero automático', text: 'Funciona cuando necesitas retirar dinero' },
      { icon: 'book', title: 'Matrícula universitaria', text: 'Abre durante el periodo de inscripción' },
      { icon: 'zap', title: 'App de mensajería', text: 'Permite enviar mensajes sin caerse' },
      { icon: 'shield', title: 'Sistema hospitalario', text: 'Permite consultar recetas o citas a tiempo' },
    ],
    threats: [
      { icon: 'alert', title: 'Fallo técnico', text: 'Caída del servidor o fallo de internet' },
      { icon: 'zap', title: 'Corte de energía', text: 'Sin electricidad no hay servicio' },
      { icon: 'server', title: 'Saturación', text: 'Demasiados usuarios al mismo tiempo' },
      { icon: 'alert', title: 'Ataques', text: 'Alguien satura el sistema e impide el acceso' },
      { icon: 'help', title: 'Falta de preparación', text: 'Sin copias de seguridad o plan de recuperación' },
    ],
    protections: [
      { measure: 'Copias de seguridad', explanation: 'Guardar una copia de la información por si algo se pierde.' },
      { measure: 'Equipos de respaldo', explanation: 'Tener otro servidor o servicio listo si el principal falla.' },
      { measure: 'Mantenimiento', explanation: 'Revisar y actualizar los sistemas antes de que fallen.' },
      { measure: 'Planes de recuperación', explanation: 'Saber qué hacer si la página o el sistema se cae.' },
      { measure: 'Protección contra ataques', explanation: 'Evitar que alguien sature el servicio y lo deje inaccesible.' },
    ],
    closingQuote:
      'La disponibilidad no solo significa tener datos guardados; significa poder usarlos cuando realmente los necesitas.',
    quiz: [
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
        explanation: 'La información existe, pero no se puede acceder a ella cuando se necesita.',
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
        explanation: 'Las copias de seguridad y los sistemas de respaldo permiten recuperar el acceso tras una falla.',
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
        explanation: 'Busca impedir que los usuarios autorizados usen el servicio (ataque de denegación de servicio).',
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
          '¿Cuál es la mejor forma de completar la frase? "La disponibilidad busca que la información esté…"',
        options: [
          { letter: 'A', text: 'Secreta para todos' },
          { letter: 'B', text: 'Correcta y sin cambios' },
          { letter: 'C', text: 'Accesible cuando se necesite' },
          { letter: 'D', text: 'Guardada solo en papel' },
        ],
        correctAnswer: 'C',
        explanation: 'Es el acceso oportuno y confiable a la información o al sistema.',
      },
    ],
  },
}
