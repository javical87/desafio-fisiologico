// Registra el Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration.scope);
      })
      .catch(error => {
        console.error('Fallo el registro del Service Worker:', error);
      });
  });
}
document.addEventListener('DOMContentLoaded', () => {
    // Definición de elementos de la interfaz de usuario por su ID
    const startScreen = document.getElementById('start-screen');
    const selectionScreen = document.getElementById('selection-screen'); // Nueva pantalla de selección
    const respiratoryIntroScreen = document.getElementById('respiratory-intro-screen');
    const renalIntroScreen = document.getElementById('renal-intro-screen');
    const acidBaseIntroScreen = document.getElementById('acid-base-intro-screen'); // Nueva pantalla de introducción para ácido-base
    const questionScreen = document.getElementById('question-screen');
    const resultsScreen = document.getElementById('results-screen');

    const startButton = document.getElementById('start-button'); // Botón inicial
    const startAllRoundsButton = document.getElementById('start-all-rounds-button'); // Nuevo botón
    const startRespiratoryButton = document.getElementById('start-respiratory-button'); // Nuevo botón
    const startRenalButton = document.getElementById('start-renal-button'); // Nuevo botón
    const startAcidBaseButton = document.getElementById('start-acid-base-button'); // Nuevo botón para ácido-base

    const beginRespiratoryButton = document.getElementById('begin-respiratory-button');
    const beginRenalButton = document.getElementById('begin-renal-button');
    const beginAcidBaseButton = document.getElementById('begin-acid-base-button'); // Nuevo botón para comenzar ronda ácido-base
    const nextButton = document.getElementById('next-button');
    const restartButton = document.getElementById('restart-button');

    // Referencia al botón "Inicio" solo en la pantalla de preguntas
    const homeButtonQuestion = document.getElementById('home-button-question');
    // Mantener la referencia al botón de inicio en resultados si se desea que siga allí
    const homeButtonResults = document.getElementById('home-button-results');


    const questionNumberSpan = document.getElementById('question-number');
    const timerSpan = document.getElementById('timer');
    const questionTextElement = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackElement = document.getElementById('feedback');
    const rationaleTextElement = document.getElementById('rationale-text');
    const finalScoreSpan = document.getElementById('final-score');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const questionMusic = document.getElementById('question-music');
    const finalMessageElement = document.getElementById('final-message');

    // Variables de estado del juego
    let currentQuestionIndex = 0; // Índice dentro del activeQuestionSet
    let score = 0; // Puntuación acumulada a lo largo de todas las rondas
    let timerInterval;
    let timeLeft = 60; // Cronómetro a 60 segundos

    let activeQuestionSet = []; // Almacena el conjunto de preguntas de la ronda actual
    let currentRoundMode = 'none'; // 'all', 'respiratory', 'renal', 'acid-base'

    // Define la secuencia de temas para el modo 'all'
    const allTopicsSequence = ['respiratory', 'renal', 'acid_base'];
    let currentTopicIndexInAllMode = 0; // Rastrea qué tema en allTopicsSequence está actualmente activo

    // Almacena los conjuntos de preguntas seleccionadas aleatoriamente para el modo 'all'
    // Se inicializarán cuando se inicie el modo 'all'
    let selectedRespiratoryQuestions = [];
    let selectedRenalQuestions = [];
    let selectedAcidBaseQuestions = [];

    // Define el número de preguntas a seleccionar aleatoriamente por cada tema
    const QUESTIONS_TO_SELECT = {
        respiratory: 10, // Seleccionar 10 preguntas de las 15 disponibles
        renal: 10,       // Seleccionar 10 preguntas de las 100 disponibles
        acid_base: 10    // Seleccionar 10 preguntas de las 20 disponibles
    };

    // Helper function to get random questions
    // Toma un conjunto de preguntas y el número deseado, y devuelve un subconjunto aleatorio.
    function getRandomQuestions(questionSet, count) {
        if (count >= questionSet.length) {
            return [...questionSet]; // Si se pide más o igual que el total, devuelve todas las preguntas
        }
        // Mezcla el array de preguntas de forma aleatoria
        const shuffled = [...questionSet].sort(() => 0.5 - Math.random());
        // Devuelve las primeras 'count' preguntas del array mezclado
        return shuffled.slice(0, count);
    }

    // Las preguntas de la trivia con formato HTML para subíndices/superíndices
    // Este array contiene todas las preguntas categorizadas por 'topic'.
    const allQuestionsData = [
        // Fisiología Respiratoria (15 preguntas)
        {
            question: 'La respiración interna corresponde al intercambio gaseoso entre los capilares pulmonares y los alvéolos.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'La respiración interna es el intercambio gaseoso entre la sangre y las células tisulares. El intercambio entre capilares pulmonares y alvéolos es la respiración externa.' },
                { text: 'Falso', isCorrect: true, rationale: 'La respiración interna es el intercambio gaseoso entre la sangre y las células tisulares. El intercambio entre capilares pulmonares y alvéolos es la respiración externa.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: 'Durante la inspiración aumenta la presión intraabdominal.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'Durante la inspiración, el diafragma desciende y empuja los órganos abdominales hacia abajo, lo que provoca un aumento de la presión intraabdominal.' },
                { text: 'Falso', isCorrect: false, rationale: 'Durante la inspiración, el diafragma desciende y empuja los órganos abdominales hacia abajo, lo que provoca un aumento de la presión intraabdominal.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: '¿Cuál es la función principal de los neumocitos tipo I?',
            options: [
                { text: 'a. Sintetizar surfactante', isCorrect: false, rationale: 'Los neumocitos tipo II son las células responsables de sintetizar y secretar surfactante pulmonar.' },
                { text: 'b. Participar en el intercambio gaseoso', isCorrect: true, rationale: 'Los neumocitos tipo I son células muy delgadas y planas que forman la mayor parte de la pared alveolar, facilitando la difusión de gases.' },
                { text: 'c. Fagocitar partículas extrañas', isCorrect: false, rationale: 'Los macrófagos alveolares son las células responsables de la fagocitosis de partículas extrañas en los alvéolos.' },
                { text: 'd. Sintetizar colágeno', isCorrect: false, rationale: 'Los fibroblastos son las células principales encargadas de la síntesis de colágeno en el tejido conectivo pulmonar.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: '¿Qué ley describe la relación entre la presión y el volumen de un gas a temperatura constante, fundamental para entender la mecánica respiratoria?',
            options: [
                { text: 'Ley de Dalton', isCorrect: false, rationale: 'La Ley de Dalton establece que la presión total de una mezcla de gases es la suma de las presiones parciales de los gases individuales.' },
                { text: 'Ley de Henry', isCorrect: false, rationale: 'La Ley de Henry describe la relación entre la solubilidad de un gas en un líquido y su presión parcial por encima del líquido.' },
                { text: 'Ley de Boyle', isCorrect: true, rationale: 'La Ley de Boyle establece que, a temperatura constante, la presión y el volumen de un gas son inversamente proporcionales, lo cual es fundamental para el flujo de aire en la mecánica respiratoria.' },
                { text: 'Ley de Charles', isCorrect: false, rationale: 'La Ley de Charles describe la relación entre el volumen y la temperatura de un gas a presión constante.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: '¿Qué volumen pulmonar representa la máxima cantidad de aire que puede ser espirada después de una inspiración máxima?',
            options: [
                { text: 'Volumen de reserva espiratoria (VER)', isCorrect: false, rationale: 'El Volumen de Reserva Espiratoria es el volumen adicional de aire que puede ser exhalado forzadamente después de una espiración normal.' },
                { text: 'Capacidad vital (CV)', isCorrect: true, rationale: 'La Capacidad Vital es la cantidad máxima de aire que se puede exhalar después de una inspiración máxima, representando la suma del volumen corriente, el volumen de reserva inspiratoria y el volumen de reserva espiratoria.' },
                { text: 'Volumen corriente (VC)', isCorrect: false, rationale: 'El Volumen Corriente es el volumen de aire que se inhala o exhala durante una respiración normal y tranquila.' },
                { text: 'Capacidad pulmonar total (CPT)', isCorrect: false, rationale: 'La Capacidad Pulmonar Total es el volumen máximo de aire que los pulmones pueden contener después de una inspiración máxima, incluyendo el volumen residual.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: '¿Cuál es el valor aproximado de la presión intrapleural durante la inspiración?',
            options: [
                { text: '+5 cmH₂O', isCorrect: false, rationale: 'Una presión intrapleural positiva dificultaría o impediría la expansión pulmonar.' },
                { text: '0 cmH₂O', isCorrect: false, rationale: 'Una presión de 0 cmH₂O (atmosférica) en el espacio intrapleural no permitiría la expansión adecuada de los pulmones.' },
                { text: '–7,5 cmH₂O', isCorrect: true, rationale: 'Durante una inspiración normal, la presión intrapleural se vuelve más negativa, alcanzando aproximadamente -7.5 cmH₂O para facilitar la expansión pulmonar.' },
                { text: '–2 cmH₂O', isCorrect: false, rationale: 'Aunque la presión intrapleural es negativa, -2 cmH₂O es un valor típicamente más cercano al final de la espiración tranquila, no el valor máximo de negatividad durante la inspiración.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: '¿Cuál de los siguientes eventos está asociado al cierre de la glotis?',
            options: [
                { text: 'Inspiración', isCorrect: false, rationale: 'Durante la inspiración normal, la glotis se abre para permitir el paso del aire.' },
                { text: 'Espiración', isCorrect: false, rationale: 'Durante la espiración normal, la glotis se abre para permitir la salida del aire.' },
                { text: 'Valsalva', isCorrect: true, rationale: 'La maniobra de Valsalva implica una espiración forzada contra una glotis cerrada para aumentar la presión intratorácica y intraabdominal.' },
                { text: 'Apnea', isCorrect: false, rationale: 'La apnea es la cesación temporal de la respiración, no necesariamente asociada a un cierre activo y prolongado de la glotis para generar presión.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: '¿Cuál de las siguientes opciones no contribuye al transporte de CO<sub>2</sub> en sangre?',
            options: [
                { text: 'Disuelto en plasma', isCorrect: false, rationale: 'Una pequeña porción del CO<sub>2</sub> se transporta disuelta directamente en el plasma.' },
                { text: 'Unido a la hemoglobina', isCorrect: false, rationale: 'El CO<sub>2</sub> puede unirse a los grupos amino de la hemoglobina para formar carbaminohemoglobina.' },
                { text: 'Como ácido carbónico libre', isCorrect: true, rationale: 'Aunque el CO<sub>2</sub> reacciona con el agua para formar ácido carbónico (H<sub>2</sub>CO<sub>3</sub>), este compuesto es muy inestable y se disocia rápidamente en iones bicarbonato y protones, por lo que no se transporta significativamente en forma de ácido carbónico libre.' },
                { text: 'Como bicarbonato', isCorrect: false, rationale: 'La mayor parte del CO<sub>2</sub> se transporta en la sangre en forma de iones bicarbonato (HCO<sub>3</sub>⁻), producido por la disociación del ácido carbónico dentro de los glóbulos rojos.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: 'El centro neumotáxico tiene un efecto inhibidor sobre la inspiración, lo que permite una espiración prolongada y profunda.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'El centro neumotáxico tiene un efecto inhibidor sobre la inspiración, lo que permite una mayor frecuencia respiratoria y un acortamiento de la duración de la inspiración.' },
                { text: 'Falso', isCorrect: true, rationale: 'El centro neumotáxico envía impulsos que inhiben la inspiración, acortando su duración y permitiendo una mayor frecuencia respiratoria, no necesariamente una espiración prolongada y profunda.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: 'El volumen de aire que permanece en los pulmones después de una espiración forzada se denomina:',
            options: [
                { text: 'Volumen Corriente (VC)', isCorrect: false, rationale: 'El Volumen Corriente es el volumen de aire que se inhala o exhala durante una respiración normal y tranquila.' },
                { text: 'Volumen de Reserva Espiratoria (VER)', isCorrect: false, rationale: 'El Volumen de Reserva Espiratoria es el volumen adicional de aire que puede ser exhalado forzadamente después de una espiración normal.' },
                { text: 'Volumen Residual (VR)', isCorrect: true, rationale: 'El Volumen Residual es el volumen de aire que permanece en los pulmones incluso después de una espiración máxima forzada, impidiendo el colapso pulmonar total.' },
                { text: 'Capacidad Residual Funcional (CRF)', isCorrect: false, rationale: 'La Capacidad Residual Funcional es el volumen de aire que queda en los pulmones después de una espiración tranquila normal, y es la suma del Volumen de Reserva Espiratoria y el Volumen Residual.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: 'Un escalador experimenta hipoxia a gran altitud. ¿Cuál de las siguientes respuestas fisiológicas NO sería una adaptación esperable o un mecanismo compensatorio a esta hipoxia?',
            options: [
                { text: 'Aumento de la producción de eritropoyetina.', isCorrect: false, rationale: 'El riñón responde a la hipoxia aumentando la producción de eritropoyetina, lo que estimula la producción de glóbulos rojos para aumentar la capacidad de transporte de oxígeno.' },
                { text: 'Hiperventilación para aumentar la P<sub>O2</sub> alveolar.', isCorrect: false, rationale: 'La hipoxia estimula los quimiorreceptores periféricos, lo que provoca hiperventilación, aumentando la P<sub>O2</sub> alveolar y facilitando la captación de oxígeno.' },
                { text: 'Desviación de la curva de disociación de la hemoglobina hacia la izquierda.', isCorrect: true, rationale: 'Una desviación a la izquierda de la curva de disociación de la hemoglobina aumenta la afinidad de la hemoglobina por el oxígeno, lo que dificultaría la liberación de oxígeno a los tejidos, siendo una respuesta contraproducente en hipoxia.' },
                { text: 'Aumento de la 2,3-difosfoglicerato (2,3-DPG) en los eritrocitos.', isCorrect: false, rationale: 'El aumento de 2,3-DPG en los eritrocitos desvía la curva de disociación de la hemoglobina hacia la derecha, disminuyendo la afinidad de la hemoglobina por el oxígeno y facilitando su liberación a los tejidos, lo cual es una adaptación beneficiosa a la hipoxia.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: 'Durante el ejercicio intenso, un atleta experimenta un aumento significativo en la producción de CO<sub>2</sub> y un descenso del pH sanguíneo. ¿Qué mecanismo reflejo es el principal responsable de aumentar la ventilación para contrarrestar estos cambios?',
            options: [
                { text: 'Estimulación de los receptores de estiramiento pulmonar.', isCorrect: false, rationale: 'Los receptores de estiramiento pulmonar están involucrados en el reflejo de Hering-Breuer, que limita la inspiración, pero no son el principal mecanismo de aumento de la ventilación en respuesta al CO<sub>2</sub> y pH.' },
                { text: 'Activación de los quimiorreceptores periféricos, sensibles principalmente a la P<sub>O2</sub> arterial.', isCorrect: false, rationale: 'Aunque los quimiorreceptores periféricos responden a cambios en la P<sub>O2</sub>, su respuesta a los cambios de P<sub>CO2</sub> y pH es menos potente que la de los quimiorreceptores centrales en condiciones normales y de ejercicio.' },
                { text: 'Estimulación de los quimiorreceptores centrales en el bulbo raquídeo, sensibles al pH del líquido cefalorraquídeo.', isCorrect: true, rationale: 'Los quimiorreceptores centrales son extremadamente sensibles a los cambios en el P<sub>CO2</sub> arterial (a través de los cambios en el pH del líquido cefalorraquídeo), y son el principal impulsor del aumento de la ventilación en respuesta a la hipercapnia inducida por el ejercicio.' },
                { text: 'Disminución de la actividad de los centros respiratorios apneústico y neumotáxico', isCorrect: false, rationale: 'Una disminución de la actividad de estos centros no aumentaría la ventilación, sino que podría alterarla o reducirla de manera ineficaz.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: 'Una disminución en la elasticidad del tejido pulmonar (como en la fibrosis pulmonar) resultaría en:',
            options: [
                { text: 'Aumento de la complianza pulmonar', isCorrect: false, rationale: 'La complianza pulmonar mide la distensibilidad del pulmón; una disminución de la elasticidad (endurecimiento) reduce la facilidad para distenderlo.' },
                { text: 'Disminución de la complianza pulmonar', isCorrect: true, rationale: 'La fibrosis pulmonar implica un aumento de la rigidez del tejido pulmonar debido a la acumulación de tejido conectivo, lo que hace que los pulmones sean más difíciles de expandir y, por lo tanto, disminuye su complianza.' },
                { text: 'No afecta la complianza pulmonar', isCorrect: false, rationale: 'La elasticidad es un factor determinante de la complianza pulmonar, por lo que su alteración sí la afectaría.' },
                { text: 'Aumento del volumen residual', isCorrect: false, rationale: 'Si bien la fibrosis puede afectar los volúmenes pulmonares, el efecto más directo de una disminución de la elasticidad es la complianza.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: '¿Cuál de los siguientes músculos es accesorio en la inspiración forzada?',
            options: [
                { text: 'Diafragma', isCorrect: false, rationale: 'El diafragma es el músculo principal de la inspiración, no accesorio.' },
                { text: 'Intercostales externos', isCorrect: false, rationale: 'Los intercostales externos son músculos principales de la inspiración normal, no solo accesorios en la forzada.' },
                { text: 'Escalenos', isCorrect: true, rationale: 'Los músculos escalenos (junto con el esternocleidomastoideo) son músculos accesorios que se activan durante la inspiración forzada para elevar el tórax y expandir la cavidad pulmonar aún más.' },
                { text: 'Recto abdominal', isCorrect: false, rationale: 'Los músculos abdominales, como el recto abdominal, son músculos accesorios de la espiración forzada, no de la inspiración.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },
        {
            question: 'El gas que regula principalmente la ventilación en condiciones normales es:',
            options: [
                { text: 'Oxígeno (O<sub>2</sub>)', isCorrect: false, rationale: 'Aunque el O<sub>2</sub> es vital, solo se convierte en un regulador principal de la ventilación cuando sus niveles caen a valores muy bajos (hipoxia severa).' },
                { text: 'Dióxido de carbono (CO<sub>2</sub>)', isCorrect: true, rationale: 'El CO<sub>2</sub> es el principal regulador de la ventilación en condiciones normales, ya que pequeños cambios en su presión parcial en sangre alteran el pH del líquido cefalorraquídeo, estimulando fuertemente los quimiorreceptores centrales.' },
                { text: 'Nitrógeno (N<sub>2</sub>)', isCorrect: false, rationale: 'El nitrógeno es un gas inerte que no participa en la regulación de la ventilación en condiciones normales.' },
                { text: 'Monóxido de Carbono (CO)', isCorrect: false, rationale: 'El monóxido de Carbono es un gas tóxico que se une fuertemente a la hemoglobina, pero no es un regulador fisiológico de la ventilación.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'respiratory'
        },

        // PREGUNTAS DE FISIOLOGÍA RENAL (Se asume que hay 100 preguntas aquí en el archivo original del usuario)
        // Nota: Por brevedad, solo se incluyen las primeras preguntas de la categoría renal.
        // Si tu archivo 'script.js' local tiene 100 preguntas renales, el código las cargará correctamente.
        {
            question: 'Los riñones reciben el 15% del gasto cardíaco.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'Los riñones reciben aproximadamente el 20-25% del gasto cardíaco, lo que representa un flujo sanguíneo muy alto en relación con su peso.' },
                { text: 'Falso', isCorrect: true, rationale: 'Los riñones reciben aproximadamente el 20-25% del gasto cardíaco, lo que representa un flujo sanguíneo muy alto en relación con su peso.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La filtración glomerular (FG) es directamente proporcional a la presión hidrostática en la cápsula de Bowman.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'La FG es inversamente proporcional a la presión hidrostática en la cápsula de Bowman. Un aumento de esta presión se opone a la filtración, disminuyendo la FG.' },
                { text: 'Falso', isCorrect: true, rationale: 'La FG es inversamente proporcional a la presión hidrostática en la cápsula de Bowman. Un aumento de esta presión se opone a la filtración, disminuyendo la FG.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de las siguientes afirmaciones sobre el túbulo contorneado proximal (TCP) es INCORRECTA?',
            options: [
                { text: 'Es el sitio principal de reabsorción de la mayoría de los solutos y agua filtrados, incluyendo glucosa y aminoácidos.', isCorrect: false, rationale: 'Esta afirmación es correcta. El TCP es el principal sitio de reabsorción masiva.' },
                { text: 'Contiene numerosas mitocondrias para proporcionar la energía necesaria para el transporte activo.', isCorrect: false, rationale: 'Esta afirmación es correcta. El alto transporte activo en el TCP requiere mucha energía, de ahí las numerosas mitocondrias.' },
                { text: 'La reabsorción de sodio en el TCP es un proceso pasivo que no requiere energía.', isCorrect: true, rationale: 'Esta afirmación es INCORRECTA. La reabsorción de sodio en el TCP es un proceso activo que requiere energía, principalmente a través de la bomba Na<sup>+</sup>/K<sup>+</sup>-ATPasa en la membrana basolateral.' },
                { text: 'La reabsorción de agua en el TCP es principalmente por ósmosis, siguiendo el movimiento de solutos.', isCorrect: false, rationale: 'Esta afirmación es correcta. La reabsorción de agua en el TCP es osmótica, conocida como reabsorción de agua obligatoria.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué segmento de la nefrona es principalmente responsable de la creación del gradiente osmótico medular, esencial para la concentración de la orina?',
            options: [
                { text: 'Asa descendente delgada', isCorrect: false, rationale: 'La rama descendente delgada es permeable al agua, pero no es la principal responsable de la creación activa del gradiente osmótico.' },
                { text: 'Asa ascendente gruesa', isCorrect: true, rationale: 'La rama ascendente gruesa del asa de Henle es impermeable al agua pero reabsorbe activamente sodio, potasio y cloro, lo que es fundamental para establecer y mantener el gradiente osmótico en la médula renal.' },
                { text: 'Túbulo proximal', isCorrect: false, rationale: 'El túbulo proximal reabsorbe gran parte del filtrado, pero no es el principal creador del gradiente osmótico medular.' },
                { text: 'Glomérulo', isCorrect: false, rationale: 'El glomérulo es para la filtración, no para la creación del gradiente osmótico.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué hormona aumenta la reabsorción de sodio y secreción de potasio?',
            options: [
                { text: 'Vasopresina', isCorrect: false, rationale: 'La vasopresina (ADH) aumenta la reabsorción de agua.' },
                { text: 'Aldosterona', isCorrect: true, rationale: 'La aldosterona, una hormona esteroidea, actúa en el túbulo colector y el túbulo contorneado distal para aumentar la reabsorción de sodio y la secreción de potasio e iones de hidrógeno.' },
                { text: 'Renina', isCorrect: false, rationale: 'La renina es una enzima que inicia el sistema renina-angiotensina-aldosterona.' },
                { text: 'Angiotensina II', isCorrect: false, rationale: 'La angiotensina II es un potente vasoconstrictor y estimula la liberación de aldosterona, pero no reabsorbe sodio ni secreta potasio directamente en los túbulos.' },
                { text: 'Desmopresina', isCorrect: false, rationale: 'La desmopresina es un análogo sintético de la ADH.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué estructura participa en la detección de flujo tubular en el aparato yuxtaglomerular?',
            options: [
                { text: 'Podocito', isCorrect: false, rationale: 'Los podocitos son parte de la barrera de filtración glomerular.' },
                { text: 'Célula principal', isCorrect: false, rationale: 'Las células principales se encuentran en el túbulo colector y son sensibles a la aldosterona y ADH.' },
                { text: 'Mácula densa', isCorrect: true, rationale: 'La mácula densa es un grupo especializado de células en el túbulo distal que detecta cambios en la concentración de NaCl en el flujo tubular y regula la TFG y la liberación de renina.' },
                { text: 'Célula mesangial', isCorrect: false, rationale: 'Las células mesangiales tienen funciones de soporte y contráctiles, pero no detectan directamente el flujo tubular.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de las siguientes sustancias es filtrado por el glomérulo pero no es metabolizada, reabsorbida ni secretada por la nefrona?',
            options: [
                { text: 'Glucosa', isCorrect: false, rationale: 'La glucosa es filtrada y reabsorbida casi por completo en el túbulo proximal.' },
                { text: 'APA', isCorrect: false, rationale: 'El ácido para-aminohipúrico (APA) es filtrado y secretado, utilizado para medir el flujo plasmático renal.' },
                { text: 'Creatinina', isCorrect: false, rationale: 'La creatinina es filtrada y mínimamente secretada, por lo que no cumple completamente con la condición de no ser secretada.' },
                { text: 'Insulina', isCorrect: false, rationale: 'La insulina es una hormona y no es una sustancia endógena que se use para medir la TFG de esta manera.' },
                { text: 'Inulina', isCorrect: true, rationale: 'La inulina es el estándar de oro para medir la TFG porque es libremente filtrada por el glomérulo y no es reabsorbida ni secretada por los túbulos renales.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Las porciones de la nefrona implicadas en la concentración activa de la orina son:',
            options: [
                { text: 'Porción S1 y S2 del túbulo contorneado proximal', isCorrect: false, rationale: 'Estas porciones reabsorben masivamente, pero no son las principales en la concentración activa de la orina.' },
                { text: 'Porción delgada del asa de Henle', isCorrect: false, rationale: 'La porción delgada del asa de Henle es permeable al agua, pero no realiza la concentración activa de solutos.' },
                { text: 'Porción S3 del túbulo contorneado proximal y porción delgada del asa de Henle', isCorrect: false, rationale: 'Ninguna de estas porciones es el sitio principal de concentración activa.' },
                { text: 'Porción gruesa del asa de Henle y túbulos colectores', isCorrect: true, rationale: 'La porción gruesa del asa de Henle reabsorbe activamente solutos sin agua, creando el gradiente osmótico. Los túbulos colectores, bajo la influencia de la ADH, permiten la reabsorción de agua a lo largo de este gradiente, concentrando la orina.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'El túbulo contorneado distal es responsable de la reabsorción de la mayoría del sodio filtrado.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'La mayor parte del sodio filtrado (aproximadamente 65-70%) se reabsorbe en el túbulo contorneado proximal, no en el distal.' },
                { text: 'Falso', isCorrect: true, rationale: 'La mayor parte del sodio filtrado (aproximadamente 65-70%) se reabsorbe en el túbulo contorneado proximal, no en el distal.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La hormona antidiurética (ADH) incrementa la permeabilidad al agua en los túbulos colectores.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'La ADH (vasopresina) se une a receptores en las células principales de los túbulos colectores, insertando acuaporinas (canales de agua) en la membrana apical y aumentando así la permeabilidad al agua.' },
                { text: 'Falso', isCorrect: false, rationale: 'La ADH (vasopresina) se une a receptores en las células principales de los túbulos colectores, insertando acuaporinas (canales de agua) en la membrana apical y aumentando así la permeabilidad al agua.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Si un paciente ingiere una gran cantidad de agua, ¿qué cambio fisiológico renal sería el más inmediato y prominente para mantener el equilibrio hídrico?',
            options: [
                { text: 'Aumento de la reabsorción de urea para mantener el gradiente osmótico medular.', isCorrect: false, rationale: 'Esto no es una respuesta inmediata al exceso de agua.' },
                { text: 'Disminución de la liberación de hormona antidiurética (ADH), lo que resulta en la excreción de una gran cantidad de orina diluida.', isCorrect: true, rationale: 'La ingesta excesiva de agua disminuye la osmolaridad plasmática, lo que inhibe la liberación de ADH, haciendo que los túbulos colectores sean menos permeables al agua y se excrete orina diluida.' },
                { text: 'Disminución de la filtración glomerular para reducir la pérdida de agua.', isCorrect: false, rationale: 'La TFG se mantiene relativamente constante y no es el principal mecanismo de respuesta a la ingesta aguda de agua.' },
                { text: 'Aumento de la liberación de aldosterona para retener sodio.', isCorrect: false, rationale: 'La aldosterona regula el sodio, no el agua directamente en respuesta a la osmolaridad.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de las siguientes es una característica INCORRECTA de las células principales en el túbulo colector?',
            options: [
                { text: 'Contienen canales de agua (acuaporinas) regulados por ADH.', isCorrect: false, rationale: 'Esta afirmación es correcta. Las acuaporinas son clave para la acción de la ADH.' },
                { text: 'Están involucradas en la secreción de potasio en respuesta a la aldosterona.', isCorrect: false, rationale: 'Esta afirmación es correcta. Las células principales secretan potasio a través de canales de potasio (ROMK) y la bomba Na<sup>+</sup>/K<sup>+</sup>-ATPasa.' },
                { text: 'Participan en la secreción activa de iones de hidrógeno para el equilibrio ácido-base.', isCorrect: true, rationale: 'Esta afirmación es INCORRECTA. La secreción activa de iones de hidrógeno en el túbulo colector es realizada principalmente por las células intercaladas tipo A, no por las células principales.' },
                { text: 'Son el sitio principal de acción de la aldosterona para la reabsorción de sodio.', isCorrect: false, rationale: 'Esta afirmación es correcta. La aldosterona estimula la inserción de canales de sodio (ENaC) en las células principales.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La creatinina es un marcador ideal para estimar la filtración glomerular porque no se reabsorbe ni se secreta significativamente en los túbulos renales.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'Falso. Aunque la creatinina es libremente filtrada y no se reabsorbe, sí se secreta en una pequeña cantidad en el túbulo proximal. Por ello, la depuración de creatinina sobreestima ligeramente la TFG real, aunque es un marcador clínico útil.' },
                { text: 'Falso', isCorrect: true, rationale: 'Falso. Aunque la creatinina es libremente filtrada y no se reabsorbe, sí se secreta en una pequeña cantidad en el túbulo proximal. Por ello, la depuración de creatinina sobreestima ligeramente la TFG real, aunque es un marcador clínico útil.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Un paciente con una dieta muy rica en potasio podría esperar que sus riñones respondan con qué cambio en la función tubular para mantener la homeostasis del potasio?',
            options: [
                { text: 'Aumento de la reabsorción de potasio en el túbulo contorneado proximal.', isCorrect: false, rationale: 'En una dieta rica en potasio, el cuerpo buscaría excretar más potasio, no reabsorberlo en el túbulo proximal.' },
                { text: 'Disminución de la actividad de la aldosterona.', isCorrect: false, rationale: 'Una dieta rica en potasio estimula la liberación de aldosterona, que promueve la secreción de potasio.' },
                { text: 'Aumento de la secreción de potasio en las células principales del túbulo colector.', isCorrect: true, rationale: 'En respuesta a una alta ingesta de potasio, la aldosterona (cuya liberación es estimulada por el potasio) aumenta la secreción de potasio por las células principales del túbulo colector, lo que lleva a su excreción urinaria.' },
                { text: 'Activación de un transportador Na<sup>+</sup> K<sup>+</sup> 2Cl<sup>-</sup> en la rama descendente del asa de Henle.', isCorrect: false, rationale: 'Este transportador es importante para el gradiente osmótico, pero no es el principal mecanismo de respuesta a la sobrecarga de potasio.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto tiene la hormona paratiroidea (PTH) sobre el manejo renal del calcio y el fosfato?',
            options: [
                { text: 'Aumenta la reabsorción de calcio y la reabsorción de fosfato.', isCorrect: false, rationale: 'La PTH aumenta la reabsorción de calcio, pero disminuye la reabsorción de fosfato.' },
                { text: 'Disminuye la reabsorción de calcio y la reabsorción de fosfato.', isCorrect: false, rationale: 'La PTH aumenta la reabsorción de calcio y disminuye la reabsorción de fosfato.' },
                { text: 'Aumenta la reabsorción de calcio y disminuye la reabsorción de fosfato.', isCorrect: true, rationale: 'La PTH actúa en el túbulo distal y el túbulo colector para aumentar la reabsorción de calcio, y en el túbulo proximal para inhibir la reabsorción de fosfato, promoviendo su excreción.' },
                { text: 'Disminuye la reabsorción de calcio y aumenta la reabsorción de fosfato.', isCorrect: false, rationale: 'La PTH aumenta la reabsorción de calcio y disminuye la reabsorción de fosfato.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál es el principal factor que determina la osmolaridad del líquido tubular en el asa descendente delgada de Henle?',
            options: [
                { text: 'Reabsorción activa de sodio.', isCorrect: false, rationale: 'La reabsorción activa de sodio ocurre en la rama ascendente gruesa.' },
                { text: 'Permeabilidad al agua y el gradiente osmótico de la médula renal.', isCorrect: true, rationale: 'La rama descendente delgada es altamente permeable al agua pero impermeable a los solutos. A medida que el líquido tubular fluye hacia la médula renal, más concentrada osmóticamente, el agua sale por ósmosis, aumentando la osmolaridad del líquido tubular.' },
                { text: 'Secreción de urea.', isCorrect: false, rationale: 'La secreción de urea ocurre en el asa de Henle, pero no es el principal factor que determina la osmolaridad del líquido tubular en la rama descendente.' },
                { text: 'Reabsorción de glucosa.', isCorrect: false, rationale: 'La glucosa se reabsorbe principalmente en el túbulo proximal.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué tipo de célula en el túbulo colector es responsable de la secreción de iones de hidrógeno (H<sup>+</sup>) y la reabsorción de bicarbonato (HCO<sub>3</sub><sup>-</sup>) durante la acidosis?',
            options: [
                { text: 'Células principales.', isCorrect: false, rationale: 'Las células principales están involucradas en la reabsorción de sodio y la secreción de potasio.' },
                { text: 'Células intercaladas tipo A.', isCorrect: true, rationale: 'Las células intercaladas tipo A son cruciales para la secreción de H<sup>+</sup> y la reabsorción de HCO<sub>3</sub><sup>-</sup>, ayudando a corregir la acidosis.' },
                { text: 'Células intercaladas tipo B.', isCorrect: false, rationale: 'Las células intercaladas tipo B secretan bicarbonato y reabsorben H<sup>+</sup>, lo que ocurre durante la alcalosis.' },
                { text: 'Células mesangiales.', isCorrect: false, rationale: 'Las células mesangiales no están en el túbulo colector y no tienen esta función.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto tiene el sistema nervioso simpático sobre el flujo sanguíneo renal y la TFG durante una situación de estrés severo o hemorragia?',
            options: [
                { text: 'Aumento del flujo sanguíneo renal y aumento de la TFG.', isCorrect: false, rationale: 'El sistema simpático causa vasoconstricción renal.' },
                { text: 'Disminución del flujo sanguíneo renal y disminución de la TFG.', isCorrect: true, rationale: 'La activación simpática provoca vasoconstricción de las arteriolas aferentes y eferentes (predominantemente aferentes), lo que reduce el flujo sanguíneo renal y, por lo tanto, disminuye la TFG para conservar volumen sanguíneo.' },
                { text: 'Aumento del flujo sanguíneo renal y disminución de la TFG.', isCorrect: false, rationale: 'Esta combinación no es típica de la respuesta simpática renal.' },
                { text: 'No tiene efecto significativo.', isCorrect: false, rationale: 'El sistema simpático tiene un efecto muy significativo en la función renal en situaciones de estrés.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál es el papel principal de los vasos rectos en la médula renal?',
            options: [
                { text: 'Filtrar la sangre para formar orina.', isCorrect: false, rationale: 'Esta es la función del glomérulo.' },
                { text: 'Mantener el gradiente osmótico medular.', isCorrect: true, rationale: 'Los vasos rectos (capilares peritubulares que rodean el asa de Henle) actúan como intercambiadores de contracorriente, minimizando la disipación del gradiente osmótico creado por el asa de Henle, lo que permite la concentración de la orina.' },
                { text: 'Reabsorber la mayor parte de la glucosa y aminoácidos.', isCorrect: false, rationale: 'Esto ocurre en el túbulo proximal.' },
                { text: 'Producir renina.', isCorrect: false, rationale: 'La renina es producida por las células yuxtaglomerulares.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'En un paciente con diabetes mellitus no controlada, la glucosa aparece en la orina (glucosuria) porque:',
            options: [
                { text: 'La glucosa no se filtra en el glomérulo.', isCorrect: false, rationale: 'La glucosa se filtra libremente en el glomérulo.' },
                { text: 'Se ha superado la capacidad máxima de reabsorción de glucosa en el túbulo proximal.', isCorrect: true, rationale: 'En la diabetes no controlada, los niveles de glucosa en sangre son tan altos que la cantidad de glucosa filtrada excede la capacidad máxima de los transportadores (SGLT) en el túbulo proximal para reabsorberla, lo que resulta en la excreción de glucosa en la orina.' },
                { text: 'La glucosa es secretada activamente en el túbulo colector.', isCorrect: false, rationale: 'La glucosa no se secreta activamente en el túbulo colector.' },
                { text: 'Hay una disminución en la producción de insulina renal.', isCorrect: false, rationale: 'La insulina no se produce en el riñón y su deficiencia sistémica es la causa de la diabetes, pero la glucosuria se debe al umbral de transporte.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La furosemida, un diurético de asa, inhibe el cotransportador Na<sup>+</sup>/K<sup>+</sup>/2Cl<sup>-</sup> en la rama ascendente gruesa del asa de Henle. ¿Cuál sería el efecto principal de este fármaco en la orina?',
            options: [
                { text: 'Aumento de la reabsorción de agua y sodio.', isCorrect: false, rationale: 'Los diuréticos aumentan la excreción, no la reabsorción.' },
                { text: 'Disminución del volumen de orina y aumento de su concentración.', isCorrect: false, rationale: 'Los diuréticos aumentan el volumen de orina y la diluyen.' },
                { text: 'Aumento de la excreción de sodio, cloro y agua, resultando en una orina más diluida.', isCorrect: true, rationale: 'Al inhibir este cotransportador, la furosemida impide la reabsorción de estos iones en la rama ascendente gruesa, lo que reduce el gradiente osmótico medular y la capacidad del riñón para concentrar la orina, llevando a una mayor excreción de agua y solutos.' },
                { text: 'Aumento de la reabsorción de potasio.', isCorrect: false, rationale: 'Los diuréticos de asa a menudo causan pérdida de potasio.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué mecanismo renal es el más importante para la eliminación de fármacos y toxinas del cuerpo?',
            options: [
                { text: 'Filtración glomerular.', isCorrect: false, rationale: 'Aunque algunos fármacos se filtran, no es el mecanismo principal para muchos de ellos.' },
                { text: 'Reabsorción tubular.', isCorrect: false, rationale: 'La reabsorción devolvería el fármaco al cuerpo.' },
                { text: 'Secreción tubular activa.', isCorrect: true, rationale: 'Muchos fármacos (especialmente bases y ácidos orgánicos) y toxinas son eliminados activamente de la sangre peritubular hacia el líquido tubular a través de sistemas de transporte específicos en el túbulo proximal y distal, lo que es un mecanismo de eliminación muy eficiente.' },
                { text: 'Metabolismo en el glomérulo.', isCorrect: false, rationale: 'El glomérulo no metaboliza fármacos.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de los siguientes NO es un estímulo para la liberación de renina?',
            options: [
                { text: 'Disminución de la presión arterial en la arteriola aferente.', isCorrect: false, rationale: 'La disminución de la presión arterial renal es un potente estímulo para la liberación de renina.' },
                { text: 'Aumento de la concentración de NaCl en la mácula densa.', isCorrect: true, rationale: 'Un aumento de NaCl en la mácula densa (indicando un flujo tubular alto) inhibe la liberación de renina, mientras que una disminución la estimula.' },
                { text: 'Estimulación de los receptores beta-1 adrenérgicos renales.', isCorrect: false, rationale: 'La activación del sistema nervioso simpático a través de receptores beta-1 en las células yuxtaglomerulares estimula la liberación de renina.' },
                { text: 'Disminución del volumen del líquido extracelular.', isCorrect: false, rationale: 'La hipovolemia (disminución del volumen del líquido extracelular) es un fuerte estímulo para la liberación de renina.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de los siguientes es el efecto más potente de la angiotensina II sobre la presión arterial?',
            options: [
                { text: 'Aumento de la frecuencia cardíaca.', isCorrect: false, rationale: 'Aunque puede tener efectos indirectos, no es su efecto más potente.' },
                { text: 'Vasoconstricción directa de las arteriolas.', isCorrect: true, rationale: 'La angiotensina II es uno de los vasoconstrictores más potentes del cuerpo, causando una contracción directa del músculo liso vascular, lo que aumenta la resistencia periférica total y, por lo tanto, la presión arterial.' },
                { text: 'Aumento de la excreción renal de sodio.', isCorrect: false, rationale: 'La angiotensina II promueve la retención de sodio, no su excreción.' },
                { text: 'Disminución de la liberación de aldosterona.', isCorrect: false, rationale: 'La angiotensina II estimula la liberación de aldosterona.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'El efecto de la angiotensina II sobre la arteriola aferente y eferente del glomérulo es:',
            options: [
                { text: 'Vasodilatación de ambas.', isCorrect: false, rationale: 'La angiotensina II es un vasoconstrictor.' },
                { text: 'Vasoconstricción de la aferente y dilatación de la eferente.', isCorrect: false, rationale: 'La angiotensina II constriñe ambas, pero más la eferente.' },
                { text: 'Vasoconstricción de la eferente más que de la aferente.', isCorrect: true, rationale: 'La angiotensina II causa una vasoconstricción preferencial de la arteriola eferente. Esto ayuda a mantener la TFG cuando el flujo sanguíneo renal disminuye, al aumentar la presión hidrostática glomerular.' },
                { text: 'No tiene efecto sobre ninguna.', isCorrect: false, rationale: 'La angiotensina II tiene efectos importantes sobre las arteriolas glomerulares.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto tiene la angiotensina II sobre la reabsorción de sodio en el túbulo contorneado proximal (TCP)?',
            options: [
                { text: 'Disminuye la reabsorción de sodio.', isCorrect: false, rationale: 'La angiotensina II promueve la reabsorción de sodio.' },
                { text: 'Aumenta la reabsorción de sodio a través de la estimulación directa de la bomba Na<sup>+</sup>/K<sup>+</sup>-ATPasa y el intercambiador Na<sup>+</sup>/H<sup>+</sup>.', isCorrect: true, rationale: 'La angiotensina II tiene un efecto directo sobre las células del TCP, aumentando la actividad de la bomba Na<sup>+</sup>/K<sup>+</sup>-ATPasa en la membrana basolateral y el intercambiador Na<sup>+</sup>/H<sup>+</sup> en la membrana apical, lo que resulta en una mayor reabsorción de sodio y agua.' },
                { text: 'No tiene efecto sobre la reabsorción de sodio.', isCorrect: false, rationale: 'La angiotensina II es un regulador clave del sodio.' },
                { text: 'Aumenta la secreción de sodio.', isCorrect: false, rationale: 'La angiotensina II causa retención de sodio.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La aldosterona es una hormona esteroidea que actúa principalmente en:',
            options: [
                { text: 'El túbulo contorneado proximal.', isCorrect: false, rationale: 'El TCP es el sitio de reabsorción masiva, pero no el sitio principal de acción de la aldosterona.' },
                { text: 'El asa de Henle.', isCorrect: false, rationale: 'La aldosterona no actúa directamente en el asa de Henle.' },
                { text: 'El túbulo colector y el túbulo contorneado distal.', isCorrect: true, rationale: 'La aldosterona ejerce sus principales efectos en las células principales del túbulo colector y en la parte final del túbulo contorneado distal.' },
                { text: 'El glomérulo.', isCorrect: false, rationale: 'El glomérulo es para la filtración.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'El principal efecto de la aldosterona en las células principales del túbulo colector es:',
            options: [
                { text: 'Aumentar la secreción de agua.', isCorrect: false, rationale: 'La aldosterona aumenta la reabsorción de agua indirectamente al reabsorber sodio.' },
                { text: 'Aumentar la reabsorción de potasio y la secreción de sodio.', isCorrect: false, rationale: 'La aldosterona aumenta la reabsorción de sodio y la secreción de potasio.' },
                { text: 'Aumentar la reabsorción de sodio y la secreción de potasio.', isCorrect: true, rationale: 'La aldosterona estimula la inserción de canales de sodio (ENaC) en la membrana apical y aumenta la actividad de la bomba Na<sup>+</sup>/K<sup>+</sup>-ATPasa en la membrana basolateral, lo que lleva a la reabsorción de sodio y la secreción de potasio.' },
                { text: 'Disminuir la reabsorción de sodio y la secreción de potasio.', isCorrect: false, rationale: 'Esto es lo opuesto al efecto de la aldosterona.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de los siguientes NO es un efecto de la angiotensina II?',
            options: [
                { text: 'Estimulación de la sed.', isCorrect: false, rationale: 'La angiotensina II estimula la sed en el cerebro.' },
                { text: 'Liberación de hormona antidiurética (ADH).', isCorrect: false, rationale: 'La angiotensina II estimula la liberación de ADH desde la hipófisis posterior.' },
                { text: 'Disminución de la presión arterial.', isCorrect: true, rationale: 'La angiotensina II es un potente vasoconstrictor y aumenta la presión arterial, no la disminuye.' },
                { text: 'Aumento de la reabsorción de sodio en el túbulo proximal.', isCorrect: false, rationale: 'La angiotensina II aumenta la reabsorción de sodio en el TCP.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto esperaría ver en la presión arterial de un paciente tratado con un IECA (inhibidor de la ECA)?',
            options: [
                { text: 'Aumento de la presión arterial.', isCorrect: false, rationale: 'Los IECA se usan para tratar la hipertensión.' },
                { text: 'Disminución de la presión arterial.', isCorrect: true, rationale: 'Al bloquear la formación de angiotensina II (un potente vasoconstrictor), los IECA causan vasodilatación y reducen la reabsorción de sodio y agua, lo que lleva a una disminución de la presión arterial.' },
                { text: 'No hay cambio en la presión arterial.', isCorrect: false, rationale: 'Los IECA tienen un efecto significativo en la presión arterial.' },
                { text: 'Aumento inicial seguido de disminución.', isCorrect: false, rationale: 'El efecto es una disminución sostenida.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Los Antagonistas del Receptor de Angiotensina II (ARA II) actúan bloqueando directamente:',
            options: [
                { text: 'La producción de renina.', isCorrect: false, rationale: 'Los ARA II no actúan sobre la producción de renina.' },
                { text: 'La enzima convertidora de angiotensina (ECA).', isCorrect: false, rationale: 'Este es el mecanismo de los IECA.' },
                { text: 'Los receptores AT1 de la angiotensina II.', isCorrect: true, rationale: 'Los ARA II bloquean selectivamente los receptores de tipo 1 (AT1) de la angiotensina II, impidiendo que la angiotensina II ejerza sus efectos vasoconstrictores y de retención de sodio/agua.' },
                { text: 'La liberación de aldosterona.', isCorrect: false, rationale: 'Los ARA II disminuyen la liberación de aldosterona indirectamente.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'En una situación de deshidratación severa, ¿qué cambios esperaría en el sistema renina-angiotensina-aldosterona?',
            options: [
                { text: 'Disminución de la renina y la aldosterona.', isCorrect: false, rationale: 'La deshidratación activa el SRAA.' },
                { text: 'Aumento de la renina, angiotensina II y aldosterona.', isCorrect: true, rationale: 'La deshidratación lleva a una disminución del volumen sanguíneo y la presión arterial, lo que activa fuertemente el SRAA para retener sodio y agua y aumentar la presión arterial.' },
                { text: 'Aumento de la renina y disminución de la aldosterona.', isCorrect: false, rationale: 'La angiotensina II estimula la aldosterona.' },
                { text: 'No hay cambios significativos.', isCorrect: false, rationale: 'La deshidratación tiene un impacto significativo en el SRAA.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué hormona es directamente responsable de la reabsorción de agua en los túbulos colectores, pero no forma parte del sistema renina-angiotensina-aldosterona?',
            options: [
                { text: 'Aldosterona', isCorrect: false, rationale: 'La aldosterona es parte del SRAA y reabsorbe sodio, lo que indirectamente arrastra agua.' },
                { text: 'Renina', isCorrect: false, rationale: 'La renina es una enzima que inicia el SRAA.' },
                { text: 'Angiotensina II', isCorrect: false, rationale: 'La angiotensina II es parte del SRAA y estimula la ADH, pero no reabsorbe agua directamente.' },
                { text: 'Hormona Antidiurética (ADH) / Vasopresina', isCorrect: true, rationale: 'La ADH (vasopresina) es responsable de la reabsorción de agua en los túbulos colectores y conductos, pero es regulada principalmente por la osmolaridad plasmática y el volumen sanguíneo, no es un componente directo del SRAA, aunque la angiotensina II puede estimular su liberación.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Un paciente con hipertensión arterial resistente a otros tratamientos podría beneficiarse de un fármaco que inhiba directamente la liberación de renina. ¿Qué tipo de fármaco sería este?',
            options: [
                { text: 'Inhibidor de la ECA (IECA).', isCorrect: false, rationale: 'Los IECA inhiben la ECA, no la renina directamente.' },
                { text: 'Antagonista del receptor de angiotensina II (ARA II).', isCorrect: false, rationale: 'Los ARA II bloquean los receptores de angiotensina II.' },
                { text: 'Inhibidor directo de la renina (por ejemplo, aliskiren).', isCorrect: true, rationale: 'Los inhibidores directos de la renina, como el aliskiren, bloquean la actividad de la renina, impidiendo el primer paso en la cascada del SRAA.' },
                { text: 'Diurético de asa.', isCorrect: false, rationale: 'Los diuréticos de asa actúan en el asa de Henle para aumentar la excreción de sodio y agua.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'El sistema renina-angiotensina-aldosterona (SRAA) es activado principalmente por:',
            options: [
                { text: 'Aumento de la presión arterial.', isCorrect: false, rationale: 'El SRAA se activa por la disminución de la presión arterial.' },
                { text: 'Disminución del volumen sanguíneo o de la presión arterial.', isCorrect: true, rationale: 'El SRAA es un sistema clave para mantener la homeostasis del volumen sanguíneo y la presión arterial, activándose en situaciones de hipovolemia o hipotensión.' },
                { text: 'Aumento de la concentración de sodio en el plasma.', isCorrect: false, rationale: 'El SRAA se activa para retener sodio cuando sus niveles son bajos o el volumen es bajo.' },
                { text: 'Estimulación parasimpática.', isCorrect: false, rationale: 'El SRAA es estimulado por el sistema simpático, no parasimpático.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La secreción de renina es inhibida por:',
            options: [
                { text: 'Hemorragia.', isCorrect: false, rationale: 'La hemorragia estimula la liberación de renina.' },
                { text: 'Estimulación beta-adrenérgica.', isCorrect: false, rationale: 'La estimulación beta-adrenérgica estimula la liberación de renina.' },
                { text: 'Aumento de la presión arterial renal.', isCorrect: true, rationale: 'Un aumento de la presión arterial renal (a través del mecanismo miogénico) y un aumento del flujo de NaCl a la mácula densa inhiben la liberación de renina, actuando como mecanismos de retroalimentación negativa.' },
                { text: 'Disminución del sodio tubular.', isCorrect: false, rationale: 'La disminución del sodio tubular estimula la liberación de renina.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de los siguientes es un efecto a largo plazo del SRAA en la fisiopatología de enfermedades cardiovasculares?',
            options: [
                { text: 'Disminución de la hipertrofia cardíaca.', isCorrect: false, rationale: 'El SRAA promueve la hipertrofia.' },
                { text: 'Vasodilatación crónica.', isCorrect: false, rationale: 'El SRAA causa vasoconstricción.' },
                { text: 'Remodelación cardíaca y vascular (fibrosis e hipertrofia).', isCorrect: true, rationale: 'La activación crónica del SRAA, particularmente por la angiotensina II, contribuye a la remodelación adversa del corazón y los vasos sanguíneos, incluyendo fibrosis e hipertrofia, lo que agrava la hipertensión y la insuficiencia cardíaca.' },
                { text: 'Aumento de la excreción de sodio y agua.', isCorrect: false, rationale: 'El SRAA promueve la retención de sodio y agua.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Un paciente con un adenoma suprarrenal que produce exceso de aldosterona (aldosteronismo primario) presentaría:',
            options: [
                { text: 'Hiponatremia e hiperkalemia.', isCorrect: false, rationale: 'El exceso de aldosterona causa retención de sodio y pérdida de potasio.' },
                { text: 'Hipernatremia e hipokalemia.', isCorrect: true, rationale: 'El exceso de aldosterona lleva a una mayor reabsorción de sodio (hipernatremia) y una mayor secreción de potasio (hipokalemia) en los túbulos renales, además de suprimir la renina.' },
                { text: 'Hiponatremia y normokalemia.', isCorrect: false, rationale: 'No es consistente con el exceso de aldosterona.' },
                { text: 'Normonatremia e hiperkalemia.', isCorrect: false, rationale: 'No es consistente con el exceso de aldosterona.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La angiotensina II tiene un efecto trófico, es decir, puede causar crecimiento y proliferación celular en diversos tejidos, incluyendo el vascular y cardíaco.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'Además de sus efectos agudos sobre la presión arterial y el volumen, la angiotensina II también actúa como un factor de crecimiento, contribuyendo a la hipertrofia y fibrosis en el sistema cardiovascular.' },
                { text: 'Falso', isCorrect: false, rationale: 'Además de sus efectos agudos sobre la presión arterial y el volumen, la angiotensina II también actúa como un factor de crecimiento, contribuyendo a la hipertrofia y fibrosis en el sistema cardiovascular.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué tipo de receptor de angiotensina II es el principal mediador de sus efectos fisiológicos y patológicos?',
            options: [
                { text: 'Receptor AT2', isCorrect: false, rationale: 'El receptor AT2 tiene funciones menos claras y a menudo opuestas a las del AT1.' },
                { text: 'Receptor AT1', isCorrect: true, rationale: 'La mayoría de los efectos fisiológicos y patológicos conocidos de la angiotensina II (vasoconstricción, liberación de aldosterona, remodelación, etc.) están mediados por la activación del receptor de tipo 1 (AT1).' },
                { text: 'Receptor AT3', isCorrect: false, rationale: 'No es un receptor de angiotensina II primario conocido.' },
                { text: 'Receptor AT4', isCorrect: false, rationale: 'No es un receptor de angiotensina II primario conocido.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La activación del sistema renina-angiotensina-aldosterona (SRAA) siempre es beneficiosa para el organismo.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'Aunque el SRAA es vital para la homeostasis aguda, su activación crónica y excesiva contribuye a enfermedades como la hipertensión, la insuficiencia cardíaca y la enfermedad renal crónica.' },
                { text: 'Falso', isCorrect: true, rationale: 'Aunque el SRAA es vital para la homeostasis aguda, su activación crónica y excesiva contribuye a enfermedades como la hipertensión, la insuficiencia cardíaca y la enfermedad renal crónica.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto tiene la aldosterona sobre los canales epiteliales de sodio (ENaC) en las células principales del túbulo colector?',
            options: [
                { text: 'Disminuye su expresión y actividad.', isCorrect: false, rationale: 'La aldosterona aumenta la reabsorción de sodio.' },
                { text: 'Aumenta su expresión y actividad.', isCorrect: true, rationale: 'La aldosterona se une a receptores intracelulares en las células principales, lo que lleva a la síntesis e inserción de más canales ENaC en la membrana apical, aumentando así la reabsorción de sodio.' },
                { text: 'No tiene efecto directo.', isCorrect: false, rationale: 'Tiene un efecto directo y crucial.' },
                { text: 'Los degrada rápidamente.', isCorrect: false, rationale: 'Los degrada rápidamente.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La liberación de renina es directamente proporcional a la presión arterial sistémica.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'La liberación de renina es inversamente proporcional a la presión arterial sistémica; una disminución de la presión la estimula.' },
                { text: 'Falso', isCorrect: true, rationale: 'La liberación de renina es inversamente proporcional a la presión arterial sistémica; una disminución de la presión la estimula.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué tipo de células en el aparato yuxtaglomerular producen y liberan renina?',
            options: [
                { text: 'Células de los túbulos contorneados distales.', isCorrect: false, rationale: 'Estas son parte de la mácula densa, pero no producen renina.' },
                { text: 'Células mesangiales extraglomerulares.', isCorrect: false, rationale: 'Estas células tienen funciones de soporte y comunicación, pero no producen renina.' },
                { text: 'Células granulares (yuxtaglomerulares) de la arteriola aferente.', isCorrect: true, rationale: 'Las células granulares, ubicadas en la pared de la arteriola aferente en el aparato yuxtaglomerular, son las principales productoras y secretoras de renina.' },
                { text: 'Podocitos.', isCorrect: false, rationale: 'Los podocitos son células de la cápsula de Bowman involucradas en la filtración.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Un paciente con estenosis de la arteria renal (estrechamiento de la arteria que irriga el riñón) podría desarrollar hipertensión debido a la activación crónica del SRAA.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'La estenosis de la arteria renal reduce el flujo sanguíneo al riñón afectado, lo que el riñón interpreta como hipotensión y responde activando crónicamente el SRAA, llevando a hipertensión secundaria.' },
                { text: 'Falso', isCorrect: false, rationale: 'La estenosis de la arteria renal reduce el flujo sanguíneo al riñón afectado, lo que el riñón interpreta como hipotensión y responde activando crónicamente el SRAA, llevando a hipertensión secundaria.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál es el efecto de la angiotensina II sobre el sistema nervioso simpático?',
            options: [
                { text: 'Lo inhibe.', isCorrect: false, rationale: 'La angiotensina II potencia el sistema simpático.' },
                { text: 'Lo estimula, aumentando la liberación de noradrenalina.', isCorrect: true, rationale: 'La angiotensina II facilita la liberación de noradrenalina de las terminaciones nerviosas simpáticas y potencia la respuesta a la noradrenalina, amplificando así los efectos vasoconstrictores y presores del sistema simpático.' },
                { text: 'No tiene efecto.', isCorrect: false, rationale: 'Tiene un efecto significativo.' },
                { text: 'Lo estimula solo en el cerebro.', isCorrect: false, rationale: 'Su efecto es más amplio.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué enzima es inhibida por los fármacos de la clase "sartanes"?',
            options: [
                { text: 'Renina.', isCorrect: false, rationale: 'La renina es inhibida por aliskiren.' },
                { text: 'ECA (Enzima Convertidora de Angiotensina).', isCorrect: false, rationale: 'La ECA es inhibida por los "pril".' },
                { text: 'Receptores AT1 de angiotensina II.', isCorrect: true, rationale: 'Los "sartanes" (como losartán, valsartán) son Antagonistas del Receptor de Angiotensina II (ARA II) y bloquean selectivamente los receptores AT1.' },
                { text: 'Aldosterona sintasa.', isCorrect: false, rationale: 'La aldosterona sintasa es inhibida por otros fármacos.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La retroalimentación negativa del SRAA ocurre cuando la angiotensina II inhibe directamente la liberación de renina.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'La angiotensina II ejerce una retroalimentación negativa de acción corta sobre la liberación de renina, lo que ayuda a modular la actividad del sistema.' },
                { text: 'Falso', isCorrect: false, rationale: 'La angiotensina II ejerce una retroalimentación negativa de acción corta sobre la liberación de renina, lo que ayuda a modular la actividad del sistema.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de los siguientes es un efecto de la angiotensina II sobre el hipotálamo?',
            options: [
                { text: 'Disminución de la liberación de ADH.', isCorrect: false, rationale: 'La angiotensina II aumenta la liberación de ADH.' },
                { text: 'Estimulación de la liberación de hormona del crecimiento.', isCorrect: false, rationale: 'No es un efecto conocido.' },
                { text: 'Estimulación de la liberación de ADH y la sensación de sed.', isCorrect: true, rationale: 'La angiotensina II actúa en el hipotálamo para estimular la liberación de ADH (vasopresina) y activar el centro de la sed, ambos mecanismos para aumentar la retención de agua y la ingesta de líquidos.' },
                { text: 'Inhibición de la liberación de renina.', isCorrect: false, rationale: 'La angiotensina II inhibe la renina, pero no es el efecto principal en el hipotálamo.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La renina es una hormona peptídica que actúa directamente sobre los vasos sanguíneos para causar vasoconstricción.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'La renina es una enzima proteolítica que inicia la cascada del SRAA, pero no es una hormona peptídica ni actúa directamente sobre los vasos sanguíneos. Es la angiotensina II la que causa vasoconstricción.' },
                { text: 'Falso', isCorrect: true, rationale: 'La renina es una enzima proteolítica que inicia la cascada del SRAA, pero no es una hormona peptídica ni actúa directamente sobre los vasos sanguíneos. Es la angiotensina II la que causa vasoconstricción.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto tiene la aldosterona sobre la excreción urinaria de potasio?',
            options: [
                { text: 'Disminuye la excreción de potasio.', isCorrect: false, rationale: 'La aldosterona aumenta la excreción de potasio.' },
                { text: 'Aumenta la excreción de potasio.', isCorrect: true, rationale: 'La aldosterona estimula la secreción de potasio por las células principales del túbulo colector, lo que lleva a un aumento de la excreción urinaria de potasio.' },
                { text: 'No tiene efecto.', isCorrect: false, rationale: 'Tiene un efecto significativo.' },
                { text: 'Solo la afecta en presencia de ADH.', isCorrect: false, rationale: 'Su efecto es directo.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Un paciente con niveles elevados de renina y angiotensina II, pero bajos niveles de aldosterona, podría tener una deficiencia en la enzima aldosterona sintasa.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'Si la renina y la angiotensina II están altas (lo que estimularía la aldosterona), pero la aldosterona está baja, sugiere un problema en la síntesis de aldosterona, como una deficiencia de la aldosterona sintasa.' },
                { text: 'Falso', isCorrect: false, rationale: 'Si la renina y la angiotensina II están altas (lo que estimularía la aldosterona), pero la aldosterona está baja, sugiere un problema en la síntesis de aldosterona, como una deficiencia de la aldosterona sintasa.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de los siguientes es un efecto de la angiotensina II que contribuye a la retención de agua?',
            options: [
                { text: 'Disminución de la reabsorción de sodio en el túbulo proximal.', isCorrect: false, rationale: 'La angiotensina II aumenta la reabsorción de sodio.' },
                { text: 'Aumento de la excreción de potasio.', isCorrect: false, rationale: 'Esto no contribuye a la retención de agua.' },
                { text: 'Estimulación de la liberación de ADH y la reabsorción de sodio.', isCorrect: true, rationale: 'La angiotensina II promueve la retención de agua indirectamente al estimular la liberación de ADH (que sí aumenta la permeabilidad al agua en los túbulos colectores) y directamente al aumentar la reabsorción de sodio en el túbulo proximal, lo que arrastra agua por ósmosis.' },
                { text: 'Vasodilatación renal.', isCorrect: false, rationale: 'La angiotensina II causa vasoconstricción renal.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La deshidratación severa activa el SRAA, lo que lleva a un aumento de la reabsorción de sodio y agua para restaurar el volumen sanguíneo.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'La deshidratación es un potente estímulo para el SRAA, que actúa para conservar líquidos y electrolitos.' },
                { text: 'Falso', isCorrect: false, rationale: 'La deshidratación es un potente estímulo para el SRAA, que actúa para conservar líquidos y electrolitos.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué tipo de fármacos se utilizan comúnmente para bloquear la acción de la angiotensina II en sus receptores?',
            options: [
                { text: 'Inhibidores de la ECA (IECA).', isCorrect: false, rationale: 'Los IECA bloquean la formación de angiotensina II, no sus receptores directamente.' },
                { text: 'Diuréticos de asa.', isCorrect: false, rationale: 'Los diuréticos de asa actúan en el asa de Henle.' },
                { text: 'Antagonistas del receptor de angiotensina II (ARA II).', isCorrect: true, rationale: 'Los ARA II (sartanes) son fármacos diseñados específicamente para bloquear los receptores AT1 de la angiotensina II, impidiendo sus efectos.' },
                { text: 'Betabloqueantes.', isCorrect: false, rationale: 'Los betabloqueantes actúan sobre los receptores beta-adrenérgicos.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de los siguientes es un efecto de la angiotensina II que contribuye a la hipertensión?',
            options: [
                { text: 'Vasodilatación periférica.', isCorrect: false, rationale: 'La angiotensina II causa vasoconstricción.' },
                { text: 'Aumento de la excreción de sodio y agua.', isCorrect: false, rationale: 'La angiotensina II causa retención de sodio y agua.' },
                { text: 'Aumento de la resistencia vascular periférica y la retención de sodio y agua.', isCorrect: true, rationale: 'La angiotensina II es un potente vasoconstrictor (aumenta la resistencia vascular periférica) y estimula la liberación de aldosterona y ADH, lo que lleva a la retención de sodio y agua, todos los cuales contribuyen al aumento de la presión arterial.' },
                { text: 'Disminución de la actividad simpática.', isCorrect: false, rationale: 'La angiotensina II aumenta la actividad simpática.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La renina convierte el angiotensinógeno en angiotensina I.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'Esta es la primera y crucial etapa en la cascada del sistema renina-angiotensina-aldosterona.' },
                { text: 'Falso', isCorrect: false, rationale: 'Esta es la primera y crucial etapa en la cascada del sistema renina-angiotensina-aldosterona.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto tendría una dieta baja en sodio sobre la actividad del SRAA?',
            options: [
                { text: 'La inhibiría.', isCorrect: false, rationale: 'Una dieta baja en sodio activaría el SRAA para conservar sodio.' },
                { text: 'La activaría para conservar sodio y agua.', isCorrect: true, rationale: 'Una dieta baja en sodio reduce el volumen del líquido extracelular, lo que activa el SRAA para aumentar la reabsorción de sodio y agua en los riñones y así restaurar el volumen.' },
                { text: 'No tendría efecto.', isCorrect: false, rationale: 'Tiene un efecto significativo.' },
                { text: 'La activaría para excretar más sodio.', isCorrect: false, rationale: 'La activaría para retener sodio.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Los inhibidores de la aldosterona (antagonistas de los receptores de mineralocorticoides) se utilizan para tratar la insuficiencia cardíaca y la hipertensión porque:',
            options: [
                { text: 'Aumentan la reabsorción de sodio y agua.', isCorrect: false, rationale: 'Estos fármacos bloquean los efectos de la aldosterona, lo que lleva a la excreción de sodio y agua.' },
                { text: 'Bloquean la producción de renina.', isCorrect: false, rationale: 'Bloquean los receptores de aldosterona, no la producción de renina.' },
                { text: 'Promueven la excreción de sodio y agua, y reducen la fibrosis.', isCorrect: true, rationale: 'Al bloquear los receptores de aldosterona, estos fármacos (como la espironolactona o eplerenona) reducen la reabsorción de sodio y agua, disminuyendo el volumen sanguíneo y la presión arterial. También atenúan los efectos pro-fibróticos y pro-hipertróficos de la aldosterona en el corazón y los vasos.' },
                { text: 'Aumentan la degradación de angiotensina II.', isCorrect: false, rationale: 'No afectan la degradación de angiotensina II.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué es el "escape de aldosterona"?',
            options: [
                { text: 'Una situación en la que la aldosterona no es liberada a pesar de los estímulos.', isCorrect: false, rationale: 'Es lo opuesto.' },
                { text: 'La incapacidad de los riñones para responder a la aldosterona.', isCorrect: false, rationale: 'Es una adaptación renal.' },
                { text: 'El fenómeno por el cual la retención de sodio y agua inducida por la aldosterona es limitada por mecanismos compensatorios, lo que evita un edema masivo.', isCorrect: true, rationale: 'A pesar de la activación continua de la aldosterona, la retención de sodio y agua no es ilimitada debido a mecanismos compensatorios como el aumento del péptido natriurético auricular (ANP) y la presión en la médula renal, lo que promueve la natriuresis y diuresis.' },
                { text: 'Una disminución de la producción de aldosterona en respuesta a una dieta alta en sodio.', isCorrect: false, rationale: 'Esto es una regulación normal, no un escape.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La angiotensina I es un potente vasoconstrictor.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'La angiotensina I es biológicamente inactiva y debe ser convertida a angiotensina II para ejercer efectos vasoconstrictores.' },
                { text: 'Falso', isCorrect: true, rationale: 'La angiotensina I es biológicamente inactiva y debe ser convertida a angiotensina II para ejercer efectos vasoconstrictores.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué células en el riñón son las principales responsables de la producción de renina?',
            options: [
                { text: 'Células de los túbulos contorneados distales.', isCorrect: false, rationale: 'Estas son parte de la mácula densa, pero no producen renina.' },
                { text: 'Células mesangiales intraglomerulares.', isCorrect: false, rationale: 'Estas células tienen funciones de soporte y contráctiles, no productoras de renina.' },
                { text: 'Células granulares (yuxtaglomerulares) de la arteriola aferente.', isCorrect: true, rationale: 'Las células granulares, ubicadas en la pared de la arteriola aferente en el aparato yuxtaglomerular, son las principales productoras y secretoras de renina.' },
                { text: 'Podocitos.', isCorrect: false, rationale: 'Los podocitos son células de la cápsula de Bowman involucradas en la filtración.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Un aumento en la P<sub>CO2</sub> arterial puede estimular indirectamente el SRAA.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'Un aumento en la P<sub>CO2</sub> (acidosis respiratoria) puede causar vasodilatación periférica e hipotensión, lo que a su vez activa el SRAA como mecanismo compensatorio para restaurar la presión arterial.' },
                { text: 'Falso', isCorrect: false, rationale: 'Un aumento en la P<sub>CO2</sub> (acidosis respiratoria) puede causar vasodilatación periférica e hipotensión, lo que a su vez activa el SRAA como mecanismo compensatorio para restaurar la presión arterial.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de los siguientes es un efecto de la angiotensina II sobre el corazón?',
            options: [
                { text: 'Disminución de la contractilidad.', isCorrect: false, rationale: 'La angiotensina II puede aumentar la contractilidad indirectamente.' },
                { text: 'Inducción de hipertrofia cardíaca.', isCorrect: true, rationale: 'La angiotensina II tiene efectos tróficos directos sobre los miocitos cardíacos, promoviendo su crecimiento (hipertrofia) y contribuyendo al remodelado cardíaco en enfermedades como la hipertensión y la insuficiencia cardíaca.' },
                { text: 'Vasodilatación coronaria.', isCorrect: false, rationale: 'La angiotensina II causa vasoconstricción.' },
                { text: 'Aumento de la bradicardia.', isCorrect: false, rationale: 'No es un efecto directo.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La aldosterona es un mineralocorticoide que se sintetiza a partir del colesterol.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'La aldosterona, como todas las hormonas esteroideas, se sintetiza a partir del colesterol en la corteza suprarrenal.' },
                { text: 'Falso', isCorrect: false, rationale: 'La aldosterona, como todas las hormonas esteroideas, se sintetiza a partir del colesterol en la corteza suprarrenal.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto tiene la angiotensina II sobre la excreción urinaria de potasio?',
            options: [
                { text: 'Aumenta la excreción de potasio a través de la estimulación de la aldosterona.', isCorrect: true, rationale: 'La angiotensina II estimula la liberación de aldosterona, y la aldosterona a su vez aumenta la secreción y, por lo tanto, la excreción de potasio en la orina.' },
                { text: 'Disminuye la excreción de potasio directamente.', isCorrect: false, rationale: 'La angiotensina II no disminuye la excreción de potasio.' },
                { text: 'No tiene efecto.', isCorrect: false, rationale: 'Tiene un efecto indirecto significativo.' },
                { text: 'Aumenta la reabsorción de potasio.', isCorrect: false, rationale: 'Aumenta la excreción.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La renina es una enzima que se produce exclusivamente en el riñón.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'Aunque el riñón es la principal fuente de renina circulante, pequeñas cantidades de renina o actividad similar a la renina se han encontrado en otros tejidos (como el cerebro, el corazón, los vasos sanguíneos y las glándulas suprarrenales), donde pueden formar sistemas locales de renina-angiotensina.' },
                { text: 'Falso', isCorrect: true, rationale: 'Aunque el riñón es la principal fuente de renina circulante, pequeñas cantidades de renina o actividad similar a la renina se han encontrado en otros tejidos (como el cerebro, el corazón, los vasos sanguíneos y las glándulas suprarrenales), donde pueden formar sistemas locales de renina-angiotensina.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de los siguientes es un efecto de la angiotensina II que contribuye a la remodelación vascular?',
            options: [
                { text: 'Inhibición del crecimiento de las células musculares lisas vasculares.', isCorrect: false, rationale: 'La angiotensina II estimula el crecimiento.' },
                { text: 'Estimulación de la síntesis de colágeno y la proliferación de células musculares lisas vasculares.', isCorrect: true, rationale: 'La angiotensina II es un potente factor de crecimiento para las células musculares lisas vasculares y los fibroblastos, promoviendo la síntesis de colágeno y la proliferación celular, lo que contribuye al engrosamiento y rigidez de la pared vascular (remodelación).' },
                { text: 'Inducción de apoptosis en las células endoteliales.', isCorrect: false, rationale: 'No es un efecto principal en la remodelación.' },
                { text: 'Aumento de la producción de óxido nítrico.', isCorrect: false, rationale: 'La angiotensina II tiende a reducir la biodisponibilidad de óxido nítrico.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La aldosterona tiene un papel importante en la homeostasis del equilibrio ácido-base al promover la secreción de iones de hidrógeno en el túbulo colector.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'La aldosterona, además de sus efectos sobre el sodio y el potasio, también estimula la actividad de la H<sup>+</sup>-ATPasa en las células intercaladas del túbulo colector, lo que aumenta la secreción de iones de hidrógeno y contribuye a la excreción de ácidos y la reabsorción de bicarbonato.' },
                { text: 'Falso', isCorrect: false, rationale: 'La aldosterona, además de sus efectos sobre el sodio y el potasio, también estimula la actividad de la H<sup>+</sup>-ATPasa en las células intercaladas del túbulo colector, lo que aumenta la secreción de iones de hidrógeno y contribuye a la excreción de ácidos y la reabsorción de bicarbonato.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto tiene el SRAA sobre la presión de filtración glomerular (PFG) en condiciones de hipovolemia?',
            options: [
                { text: 'Disminuye la PFG significativamente.', isCorrect: false, rationale: 'El SRAA intenta mantener la TFG.' },
                { text: 'Ayuda a mantener la PFG al causar vasoconstricción preferencial de la arteriola eferente.', isCorrect: true, rationale: 'En hipovolemia, el SRAA se activa. La angiotensina II constriñe la arteriola eferente más que la aferente, lo que eleva la presión hidrostática glomerular y ayuda a mantener la TFG a pesar de la disminución del flujo sanguíneo renal total.' },
                { text: 'Aumenta la PFG al dilatar la arteriola aferente.', isCorrect: false, rationale: 'La angiotensina II constriñe la aferente y eferente, no dilata la aferente en este contexto.' },
                { text: 'No tiene efecto sobre la PFG.', isCorrect: false, rationale: 'Tiene un efecto crucial.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La renina es liberada en respuesta a la estimulación de los barorreceptores en el seno carotídeo.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'Los barorreceptores en el seno carotídeo y el arco aórtico detectan cambios en la presión arterial y envían señales al sistema nervioso central, que a su vez puede influir en la liberación de renina a través del sistema simpático, pero no es una liberación directa por los barorreceptores.' },
                { text: 'Falso', isCorrect: true, rationale: 'Los barorreceptores en el seno carotídeo y el arco aórtico detectan cambios en la presión arterial y envían señales al sistema nervioso central, que a su vez puede influir en la liberación de renina a través de el sistema simpático, pero no es una liberación directa por los barorreceptores.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto tiene la angiotensina II sobre la reabsorción de agua en el túbulo colector?',
            options: [
                { text: 'Directamente aumenta la permeabilidad al agua.', isCorrect: false, rationale: 'La ADH hace esto, aunque la angiotensina II estimula la ADH.' },
                { text: 'Indirectamente, al estimular la liberación de ADH y la reabsorción de sodio.', isCorrect: true, rationale: 'La angiotensina II no tiene un efecto directo sobre la permeabilidad al agua en el túbulo colector. Sin embargo, promueve la reabsorción de agua indirectamente al estimular la liberación de ADH (que sí aumenta la permeabilidad al agua) y al aumentar la reabsorción de sodio en el túbulo proximal, lo que crea un gradiente osmótico para la reabsorción de agua.' },
                { text: 'Disminuye la reabsorción de agua.', isCorrect: false, rationale: 'La angiotensina II promueve la retención de agua.' },
                { text: 'No tiene efecto.', isCorrect: false, rationale: 'Tiene un efecto indirecto importante.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Los inhibidores de la enzima convertidora de angiotensina (IECA) pueden causar tos seca como efecto secundario debido a la acumulación de:',
            options: [
                { text: 'Angiotensina I.', isCorrect: false, rationale: 'La acumulación de angiotensina I no causa tos seca.' },
                { text: 'Bradicinina.', isCorrect: true, rationale: 'La ECA no solo convierte angiotensina I en angiotensina II, sino que también degrada la bradicinina (un péptido vasodilatador y pro-inflamatorio). Al inhibir la ECA, los IECA aumentan los niveles de bradicinina, lo que puede provocar tos seca y angioedema.' },
                { text: 'Renina.', isCorrect: false, rationale: 'La renina no causa tos seca.' },
                { text: 'Aldosterona.', isCorrect: false, rationale: 'La aldosterona no causa tos seca.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué tipo de fármacos son los "pril" (ej. enalapril, lisinopril)?',
            options: [
                { text: 'Antagonistas del receptor de angiotensina II.', isCorrect: false, rationale: 'Los "sartanes" son ARA II.' },
                { text: 'Inhibidores de la ECA.', isCorrect: true, rationale: 'Los fármacos que terminan en "-pril" son inhibidores de la enzima convertidora de angiotensina (IECA).' },
                { text: 'Diuréticos.', isCorrect: false, rationale: 'Los diuréticos tienen diferentes terminaciones.' },
                { text: 'Betabloqueantes.', isCorrect: false, rationale: 'Los betabloqueantes terminan en "-lol".' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La angiotensina II es un potente estimulante de la liberación de aldosterona.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'La angiotensina II es el principal factor que regula la secreción de aldosterona desde la zona glomerulosa de la corteza suprarrenal.' },
                { text: 'Falso', isCorrect: false, rationale: 'La angiotensina II es el principal factor que regula la secreción de aldosterona desde la zona glomerulosa de la corteza suprarrenal.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de los siguientes es un efecto de la aldosterona sobre el pH sanguíneo?',
            options: [
                { text: 'Causa acidosis metabólica.', isCorrect: false, rationale: 'La aldosterona tiende a causar alcalosis.' },
                { text: 'Promueve la excreción de iones de hidrógeno, contribuyendo a la alcalosis metabólica.', isCorrect: true, rationale: 'La aldosterona estimula la bomba H<sup>+</sup>-ATPasa en las células intercaladas del túbulo colector, lo que aumenta la secreción de H<sup>+</sup> y, por lo tanto, contribuye a la alcalosis metabólica.' },
                { text: 'No tiene efecto sobre el pH.', isCorrect: false, rationale: 'Tiene un efecto indirecto.' },
                { text: 'Causa acidosis respiratoria.', isCorrect: false, rationale: 'La aldosterona no afecta directamente la respiración.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La angiotensina II puede estimular la remodelación cardíaca y vascular, lo que contribuye a la progresión de enfermedades cardiovasculares.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'La angiotensina II es un factor clave en la patogénesis de la hipertrofia cardíaca, la fibrosis y la disfunción endotelial, todos los cuales son componentes de la remodelación cardiovascular adversa.' },
                { text: 'Falso', isCorrect: false, rationale: 'La angiotensina II es un factor clave en la patogénesis de la hipertrofia cardíaca, la fibrosis y la disfunción endotelial, todos los cuales son componentes de la remodelación cardiovascular adversa.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué es el angiotensinógeno?',
            options: [
                { text: 'Una enzima que produce angiotensina I.', isCorrect: false, rationale: 'Es un sustrato, no una enzima.' },
                { text: 'Un péptido biológicamente activo que eleva la presión arterial.', isCorrect: false, rationale: 'Es un precursor inactivo.' },
                { text: 'Un precursor inactivo de la angiotensina I, producido en el hígado.', isCorrect: true, rationale: 'El angiotensinógeno es una proteína alfa-globulina producida por el hígado que es el sustrato sobre el cual actúa la renina para iniciar la cascada del SRAA.' },
                { text: 'Un receptor de angiotensina II.', isCorrect: false, rationale: 'Es un sustrato, no un receptor.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La liberación de renina es inhibida por un aumento en la presión de perfusión renal.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'Las células granulares de la arteriola aferente son sensibles a la presión. Un aumento de la presión reduce la liberación de renina.' },
                { text: 'Falso', isCorrect: false, rationale: 'Las células granulares de la arteriola aferente son sensibles a la presión. Un aumento de la presión reduce la liberación de renina.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto tiene la angiotensina II sobre la liberación de noradrenalina de las terminaciones nerviosas simpáticas?',
            options: [
                { text: 'Disminuye su liberación.', isCorrect: false, rationale: 'La angiotensina II potencia la actividad simpática.' },
                { text: 'Aumenta su liberación.', isCorrect: true, rationale: 'La angiotensina II potencia la actividad del sistema nervioso simpático al facilitar la liberación de noradrenalina de las terminaciones nerviosas y al inhibir su recaptación, lo que amplifica los efectos vasoconstrictores y cronotrópicos.' },
                { text: 'No tiene efecto.', isCorrect: false, rationale: 'Tiene un efecto significativo.' },
                { text: 'Solo la afecta en el cerebro.', isCorrect: false, rationale: 'Su efecto es sistémico.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Los fármacos que bloquean los receptores AT1 de la angiotensina II (ARA II) tienen un perfil de efectos secundarios similar a los IECA, incluyendo tos seca y angioedema.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'Los ARA II generalmente no causan tos seca ni angioedema porque no afectan la degradación de la bradicinina, a diferencia de los IECA.' },
                { text: 'Falso', isCorrect: true, rationale: 'Los ARA II generalmente no causan tos seca ni angioedema porque no afectan la degradación de la bradicinina, a diferencia de los IECA.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál es el principal mecanismo por el cual el sistema renina-angiotensina-aldosterona (SRAA) contribuye a la regulación a largo plazo de la presión arterial?',
            options: [
                { text: 'Ajuste rápido de la frecuencia cardíaca.', isCorrect: false, rationale: 'La frecuencia cardíaca es un ajuste a corto plazo.' },
                { text: 'Regulación del volumen de líquido extracelular y la resistencia vascular periférica.', isCorrect: true, rationale: 'El SRAA regula la presión arterial a largo plazo principalmente a través de la angiotensina II (vasoconstricción y efectos en el volumen) y la aldosterona (retención de sodio y agua), que en conjunto controlan el volumen de líquido extracelular y la resistencia vascular periférica.' },
                { text: 'Modulación de la contractilidad miocárdica.', isCorrect: false, rationale: 'No es el principal mecanismo a largo plazo.' },
                { text: 'Control directo de la actividad barorreceptora.', isCorrect: false, rationale: 'No es un control directo.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La aldosterona es una hormona que se une a receptores en el citoplasma de las células diana.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'Como hormona esteroidea, la aldosterona es lipofílica y atraviesa la membrana celular para unirse a receptores de mineralocorticoides en el citoplasma, formando un complejo que se transloca al núcleo para modular la expresión génica.' },
                { text: 'Falso', isCorrect: false, rationale: 'Como hormona esteroidea, la aldosterona es lipofílica y atraviesa la membrana celular para unirse a receptores de mineralocorticoides en el citoplasma, formando un complejo que se transloca al núcleo para modular la expresión génica.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto tiene la angiotensina II sobre la excreción urinaria de sodio?',
            options: [
                { text: 'Aumenta la excreción de sodio.', isCorrect: false, rationale: 'La angiotensina II promueve la retención de sodio.' },
                { text: 'Disminuye la excreción de sodio (aumenta la reabsorción).', isCorrect: true, rationale: 'La angiotensina II aumenta la reabsorción de sodio directamente en el túbulo proximal y también indirectamente al estimular la liberación de aldosterona, lo que reduce la excreción urinaria de sodio.' },
                { text: 'No tiene efecto.', isCorrect: false, rationale: 'Tiene un efecto significativo.' },
                { text: 'Solo la afecta en el glomérulo.', isCorrect: false, rationale: 'Su efecto es tubular.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La liberación de renina es estimulada por la activación del sistema nervioso parasimpático.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'La liberación de renina es estimulada por la activación del sistema nervioso simpático (receptores beta-1), no parasimpático.' },
                { text: 'Falso', isCorrect: true, rationale: 'La liberación de renina es estimulada por la activación del sistema nervioso simpático (receptores beta-1), no parasimpático.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de los siguientes es un efecto de la angiotensina II sobre el potasio sérico?',
            options: [
                { text: 'Aumenta el potasio sérico.', isCorrect: false, rationale: 'La angiotensina II, a través de la aldosterona, tiende a disminuir el potasio sérico.' },
                { text: 'Disminuye el potasio sérico al estimular la secreción de aldosterona.', isCorrect: true, rationale: 'La angiotensina II estimula la liberación de aldosterona, la cual aumenta la secreción renal de potasio, lo que tiende a disminuir los niveles de potasio sérico.' },
                { text: 'No tiene efecto.', isCorrect: false, rationale: 'Tiene un efecto indirecto.' },
                { text: 'Lo regula solo en el túbulo proximal.', isCorrect: false, rationale: 'Su efecto principal es en el túbulo colector a través de aldosterona.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Los inhibidores de la renina son una clase de fármacos que actúan bloqueando la primera etapa del SRAA.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'Los inhibidores directos de la renina (como aliskiren) bloquean la conversión de angiotensinógeno a angiotensina I, siendo el primer punto de control del SRAA.' },
                { text: 'Falso', isCorrect: false, rationale: 'Los inhibidores directos de la renina (como aliskiren) bloquean la conversión de angiotensinógeno a angiotensina I, siendo el primer punto de control del SRAA.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué efecto tiene la angiotensina II sobre la sed y la ingesta de agua?',
            options: [
                { text: 'Disminuye la sed y la ingesta de agua.', isCorrect: false, rationale: 'La angiotensina II aumenta la sed.' },
                { text: 'Aumenta la sed y la ingesta de agua.', isCorrect: true, rationale: 'La angiotensina II actúa en el cerebro para estimular directamente el centro de la sed, promoviendo el consumo de líquidos para ayudar a restaurar el volumen sanguíneo.' },
                { text: 'No tiene efecto.', isCorrect: false, rationale: 'Tiene un efecto significativo.' },
                { text: 'Solo la afecta en el riñón.', isCorrect: false, rationale: 'Su efecto es central.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Un paciente con hipertensión renovascular (causada por estenosis de la arteria renal) a menudo tiene niveles elevados de renina.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'La estenosis de la arteria renal reduce el flujo sanguíneo al riñón, lo que se percibe como una disminución de la presión de perfusión renal, estimulando crónicamente la liberación de renina y la activación del SRAA.' },
                { text: 'Falso', isCorrect: false, rationale: 'La estenosis de la arteria renal reduce el flujo sanguíneo al riñón, lo que se percibe como una disminución de la presión de perfusión renal, estimulando crónicamente la liberación de renina y la activación del SRAA.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La aldosterona es una hormona que promueve principalmente la reabsorción de potasio en el túbulo colector.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'La aldosterona promueve la secreción de potasio y la reabsorción de sodio.' },
                { text: 'Falso', isCorrect: true, rationale: 'La aldosterona promueve la secreción de potasio y la reabsorción de sodio.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál de los siguientes es un efecto de la angiotensina II sobre el sistema nervioso central?',
            options: [
                { text: 'Inhibición de la liberación de ADH.', isCorrect: false, rationale: 'La angiotensina II estimula la liberación de ADH.' },
                { text: 'Estimulación de la liberación de ADH y la sensación de sed.', isCorrect: true, rationale: 'La angiotensina II actúa en el cerebro, específicamente en los órganos circunventriculares, para estimular la liberación de ADH desde la hipófisis posterior y activar el centro de la sed.' },
                { text: 'Disminución de la actividad simpática.', isCorrect: false, rationale: 'La angiotensina II aumenta la actividad simpática.' },
                { text: 'Inducción de sueño.', isCorrect: false, rationale: 'No es un efecto conocido.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'Los fármacos que bloquean la aldosterona (antagonistas de los receptores de mineralocorticoides) pueden causar hiperkalemia como efecto secundario.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'Al bloquear los efectos de la aldosterona, estos fármacos reducen la secreción de potasio en el túbulo colector, lo que puede llevar a una retención de potasio y, por lo tanto, a hiperkalemia.' },
                { text: 'Falso', isCorrect: false, rationale: 'Al bloquear los efectos de la aldosterona, estos fármacos reducen la secreción de potasio en el túbulo colector, lo que puede llevar a una retención de potasio y, por lo tanto, a hiperkalemia.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'El sistema renina-angiotensina-aldosterona se activa en respuesta a la sobrecarga de volumen.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'El SRAA se activa en respuesta a la disminución del volumen o la presión arterial, no a la sobrecarga de volumen (que tendería a suprimirlo).' },
                { text: 'Falso', isCorrect: true, rationale: 'El SRAA se activa en respuesta a la disminución del volumen o la presión arterial, no a la sobrecarga de volumen (que tendería a suprimirlo).' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál es el efecto de la angiotensina II sobre la liberación de catecolaminas de la médula suprarrenal?',
            options: [
                { text: 'La inhibe.', isCorrect: false, rationale: 'La angiotensina II estimula la liberación de catecolaminas.' },
                { text: 'La estimula.', isCorrect: true, rationale: 'La angiotensina II puede estimular directamente la liberación de catecolaminas (adrenalina y noradrenalina) de la médula suprarrenal, lo que contribuye a sus efectos presores y simpaticomiméticos.' },
                { text: 'No tiene efecto.', isCorrect: false, rationale: 'Tiene un efecto.' },
                { text: 'Solo la afecta en el riñón.', isCorrect: false, rationale: 'Su efecto es sistémico.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: 'La aldosterona es esencial para la vida debido a su papel en la regulación del equilibrio de sodio, potasio y el volumen sanguíneo.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'La aldosterona es una hormona vital para mantener la homeostasis de electrolitos y el volumen de líquido extracelular, lo que es crucial para la presión arterial y la función cardiovascular.' },
                { text: 'Falso', isCorrect: false, rationale: 'La aldosterona es una hormona vital para mantener la homeostasis de electrolitos y el volumen de líquido extracelular, lo que es crucial para la presión arterial y la función cardiovascular.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál es el papel del Péptido Natriurético Auricular (ANP) en la regulación renal?',
            options: [
                { text: 'A. Aumenta la reabsorción de sodio y agua.', isCorrect: false, rationale: 'El ANP promueve la excreción de sodio y agua.' },
                { text: 'B. Disminuye la TFG.', isCorrect: false, rationale: 'El ANP tiende a aumentar la TFG y el flujo sanguíneo renal.' },
                { text: 'C. Inhibe la liberación de renina y aldosterona, y promueve la natriuresis y diuresis.', isCorrect: true, rationale: 'El ANP es una hormona liberada por las aurículas cardíacas en respuesta a la distensión. Su función es contrarrestar la retención de sodio y agua, inhibiendo la liberación de renina y aldosterona, y promoviendo la natriuresis (excreción de sodio) y diuresis (excreción de agua), lo que ayuda a reducir el volumen sanguíneo y la presión arterial.' },
                { text: 'D. Aumenta la vasoconstricción.', isCorrect: false, rationale: 'El ANP es un vasodilatador.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué transportador es el sitio de acción de los diuréticos tiazídicos?',
            options: [
                { text: 'A. Cotransportador Na<sup>+</sup>/K<sup>+</sup>/2Cl<sup>-</sup> en el asa de Henle.', isCorrect: false, rationale: 'Este es el sitio de acción de los diuréticos de asa (como la furosemida).' },
                { text: 'B. Cotransportador Na<sup>+</sup>/Cl<sup>-</sup> en el túbulo contorneado distal.', isCorrect: true, rationale: 'Los diuréticos tiazídicos (como la hidroclorotiazida) actúan inhibiendo este cotransportador en la membrana apical de las células del túbulo contorneado distal, lo que reduce la reabsorción de sodio y cloro y aumenta su excreción.' },
                { text: 'C. Canales de sodio epiteliales (ENaC) en el túbulo colector.', isCorrect: false, rationale: 'Este es el sitio de acción de los diuréticos ahorradores de potasio (como amilorida o triamtereno).' },
                { text: 'D. Acuaporinas en el túbulo colector.', isCorrect: false, rationale: 'Las acuaporinas son canales de agua regulados por la ADH, no el sitio de acción principal de los diuréticos tiazídicos.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál es la principal función de la urea en el mecanismo de concentración de la orina?',
            options: [
                { text: 'A. Es un osmolito que contribuye al gradiente osmótico en la médula renal interna.', isCorrect: true, rationale: 'La urea se recicla en la médula interna y contribuye significativamente a la hiperosmolaridad medular, lo que permite la reabsorción de agua en los túbulos colectores bajo la influencia de la ADH, concentrando así la orina.' },
                { text: 'B. Es reabsorbida activamente en el asa ascendente gruesa.', isCorrect: false, rationale: 'La urea se reabsorbe y secreta en diferentes segmentos, pero su papel clave es como osmolito en la médula, no una reabsorción activa principal en el asa ascendente gruesa.' },
                { text: 'C. Es el principal soluto que se filtra en el glomérulo.', isCorrect: false, rationale: 'El sodio y el agua son los principales componentes del filtrado glomerular.' },
                { text: 'D. Regula la liberación de renina.', isCorrect: false, rationale: 'La urea no regula directamente la liberación de renina.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Qué ocurre con la reabsorción de bicarbonato (HCO<sub>3</sub><sup>-</sup>) en el túbulo contorneado proximal (TCP) cuando hay un aumento en la P<sub>CO2</sub> arterial (acidosis respiratoria)?',
            options: [
                { text: 'A. Disminuye la reabsorción de bicarbonato.', isCorrect: false, rationale: 'El riñón compensa la acidosis respiratoria aumentando la reabsorción de bicarbonato.' },
                { text: 'B. Aumenta la reabsorción de bicarbonato.', isCorrect: true, rationale: 'En la acidosis respiratoria, el aumento de la P<sub>CO2</sub> lleva a un aumento de H<sup>+</sup> en el líquido tubular del TCP. Esto estimula el intercambiador Na<sup>+</sup>/H<sup>+</sup> y la anhidrasa carbónica, aumentando la reabsorción de bicarbonato para elevar el pH sanguíneo y compensar la acidosis.' },
                { text: 'C. No hay cambio en la reabsorción de bicarbonato.', isCorrect: false, rationale: 'Hay una compensación activa por parte del riñón.' },
                { text: 'D. Se secreta bicarbonato en el TCP.', isCorrect: false, rationale: 'El TCP reabsorbe bicarbonato, no lo secreta.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        {
            question: '¿Cuál es la principal consecuencia de la pérdida de la capacidad de concentración de la orina en la diabetes insípida nefrogénica?',
            options: [
                { text: 'A. Oliguria y orina muy concentrada.', isCorrect: false, rationale: 'La diabetes insípida se caracteriza por poliuria (gran volumen de orina) y orina diluida.' },
                { text: 'B. Poliuria y orina muy diluida.', isCorrect: true, rationale: 'En la diabetes insípida nefrogénica, los túbulos colectores no responden a la ADH (vasopresina), lo que impide la reabsorción de agua y resulta en la excreción de grandes volúmenes de orina diluida, llevando a poliuria y polidipsia (sed intensa).' },
                { text: 'C. Glucosuria.', isCorrect: false, rationale: 'La glucosuria es característica de la diabetes mellitus (problema con la glucosa), no de la diabetes insípida (problema con el agua).' },
                { text: 'D. Hipertensión arterial.', isCorrect: false, rationale: 'La poliuria excesiva puede llevar a deshidratación e hipotensión, no hipertensión.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'renal'
        },
        // Aquí irían las 50 preguntas restantes de Fisiología Renal para completar las 100
        // (No se incluyen por brevedad en esta respuesta, pero tu archivo local las tendría)
        // ... (Pregunta 51 a 100 de Fisiología Renal) ...

        // PREGUNTAS DE EQUILIBRIO ÁCIDO-BASE (20 preguntas)
        {
            question: 'El principal sistema tampón intracelular está compuesto por:',
            options: [
                { text: 'Bicarbonato', isCorrect: false, rationale: 'El bicarbonato es el principal tampón extracelular.' },
                { text: 'Albúmina', isCorrect: false, rationale: 'La albúmina es una proteína plasmática, un tampón extracelular no bicarbonato.' },
                { text: 'Amonio', isCorrect: false, rationale: 'El amonio es un tampón urinario crucial para la excreción de ácidos.' },
                { text: 'Proteínas y fosfatos', isCorrect: true, rationale: 'Dentro de las células, las proteínas (especialmente la hemoglobina en los eritrocitos) y los fosfatos son los tampones más abundantes y efectivos.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'Un paciente con cetoacidosis diabética presenta los siguientes valores de gases arteriales: pH 7.15, P<sub>CO2</sub> 25 mmHg, HCO<sub>3</sub>⁻ 10 mEq/L. ¿Cuál es el desequilibrio ácido-base primario y cuál es el estado de compensación respiratoria esperado?',
            options: [
                { text: 'Acidosis metabólica descompensada; no hay compensación respiratoria.', isCorrect: false, rationale: 'El pH bajo y el bicarbonato bajo indican acidosis metabólica. La PCO2 baja indica que hay compensación respiratoria, por lo que no está descompensada.' },
                { text: 'Acidosis respiratoria aguda; compensación renal parcial.', isCorrect: false, rationale: 'El pH bajo y la PCO2 baja no son consistentes con acidosis respiratoria aguda. El bicarbonato alto sería una compensación renal, pero aquí está bajo.' },
                { text: 'Acidosis metabólica primaria; compensación respiratoria parcial.', isCorrect: true, rationale: 'El pH bajo y el HCO3⁻ bajo indican acidosis metabólica primaria. La PCO2 también está baja, lo que indica que hay una compensación respiratoria (hiperventilación) para intentar elevar el pH. Sin embargo, el pH sigue siendo anormal, lo que significa que la compensación es parcial.' },
                { text: 'Alcalosis metabólica; compensación respiratoria completa.', isCorrect: false, rationale: 'Los valores de pH y bicarbonato son inconsistentes con alcalosis metabólica.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'Un paciente con vómitos severos y prolongados podría desarrollar una alcalosis metabólica. ¿Cuál de las siguientes es una causa principal de esta condición en este escenario?',
            options: [
                { text: 'Pérdida significativa de iones de hidrógeno y cloro del estómago.', isCorrect: true, rationale: 'Los vómitos severos resultan en la pérdida de ácido clorhídrico (HCl) del estómago, lo que lleva a una retención neta de bicarbonato en el cuerpo y, por lo tanto, a una alcalosis metabólica.' },
                { text: 'Producción excesiva de ácido láctico.', isCorrect: false, rationale: 'La producción excesiva de ácido láctico causaría acidosis metabólica.' },
                { text: 'Aumento de la excreción renal de bicarbonato.', isCorrect: false, rationale: 'El riñón intentaría retener bicarbonato para compensar la acidosis, no excretarlo.' },
                { text: 'Retención de CO<sub>2</sub> debido a hipoventilación compensatoria.', isCorrect: false, rationale: 'La retención de CO<sub>2</sub> causaría acidosis respiratoria, y la hipoventilación sería una compensación a la alcalosis, no la causa.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'La ecuación de Henderson-Hasselbalch es fundamental para entender el equilibrio ácido-base porque relaciona el pH, la P<sub>CO2</sub> y la concentración de bicarbonato. ¿Cuál de las siguientes representa correctamente esta ecuación?',
            options: [
                { text: 'pH = pK<sub>a</sub> + log([HCO<sub>3</sub>⁻] / [H<sub>2</sub>CO<sub>3</sub>])', isCorrect: true, rationale: 'Esta es la forma correcta de la ecuación de Henderson-Hasselbalch para el sistema tampón bicarbonato, que relaciona el pH con el pK<sub>a</sub> del ácido carbónico y la relación entre la base conjugada (bicarbonato) y el ácido (ácido carbónico, que está en equilibrio con el CO<sub>2</sub>).' },
                { text: 'pH = pK<sub>a</sub> + log([H<sub>2</sub>CO<sub>3</sub>] / [HCO<sub>3</sub>⁻])', isCorrect: false, rationale: 'Esta forma es incorrecta; la base conjugada debe estar en el numerador.' },
                { text: 'pH = P<sub>CO2</sub> - [HCO<sub>3</sub>⁻]', isCorrect: false, rationale: 'Esta no es la ecuación de Henderson-Hasselbalch.' },
                { text: 'pH = [H<sup>+</sup>] / [OH<sup>-</sup>]', isCorrect: false, rationale: 'Esta es una relación básica de pH, no la ecuación de Henderson-Hasselbalch.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'Un paciente con diarrea severa y prolongada presenta acidosis metabólica con anión gap normal. ¿Qué hallazgo electrolítico es el más consistente con esta condición?',
            options: [
                { text: 'Aumento del lactato sérico.', isCorrect: false, rationale: 'El aumento del lactato sérico causaría acidosis metabólica con anión gap elevado.' },
                { text: 'Hipokalemia.', isCorrect: false, rationale: 'Aunque la diarrea puede causar hipokalemia, no es el hallazgo más consistente con la acidosis metabólica de anión gap normal en este contexto.' },
                { text: 'Hipercloremia.', isCorrect: true, rationale: 'La acidosis metabólica con anión gap normal (también conocida como acidosis metabólica hiperclorémica) a menudo se debe a la pérdida de bicarbonato (como en la diarrea), lo que se compensa con una retención de cloro para mantener la electroneutralidad.' },
                { text: 'Hiponatremia severa.', isCorrect: false, rationale: 'La hiponatremia no es un hallazgo directo y más consistente con este tipo específico de acidosis.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'Si un paciente hiperventila intencionalmente durante un período prolongado, ¿cuál de los siguientes desequilibrios ácido-base podría desarrollar?',
            options: [
                { text: 'Alcalosis respiratoria.', isCorrect: true, rationale: 'La hiperventilación excesiva elimina CO<sub>2</sub> del cuerpo, lo que disminuye la P<sub>CO2</sub> arterial. Una P<sub>CO2</sub> baja reduce la concentración de H<sub>2</sub>CO<sub>3</sub> y, por lo tanto, aumenta el pH sanguíneo, resultando en alcalosis respiratoria.' },
                { text: 'Acidosis metabólica.', isCorrect: false, rationale: 'La acidosis metabólica es causada por la acumulación de ácidos no volátiles o la pérdida de bicarbonato.' },
                { text: 'Alcalosis metabólica.', isCorrect: false, rationale: 'La alcalosis metabólica es causada por la retención de bicarbonato o la pérdida de ácidos no volátiles.' },
                { text: 'Acidosis respiratoria.', isCorrect: false, rationale: 'La acidosis respiratoria es causada por la hipoventilación y la retención de CO<sub>2</sub>.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: '¿Cuál de los siguientes es el mecanismo primario por el cual los riñones excretan el exceso de ácidos no volátiles (como el ácido sulfúrico o el fosfórico) en el cuerpo?',
            options: [
                { text: 'Excreción de CO<sub>2</sub> a través de la respiración.', isCorrect: false, rationale: 'La excreción de CO<sub>2</sub> es una función pulmonar, no renal, y maneja ácidos volátiles.' },
                { text: 'Aumento de la filtración glomerular.', isCorrect: false, rationale: 'Aunque los ácidos se filtran, la filtración por sí sola no es el mecanismo principal de excreción de ácidos no volátiles.' },
                { text: 'Reabsorción de bicarbonato en el túbulo contorneado proximal.', isCorrect: false, rationale: 'La reabsorción de bicarbonato conserva el tampón, pero no excreta el exceso de ácidos.' },
                { text: 'Secreción de iones de hidrógeno (H<sup>+</sup>) y titulación con amortiguadores urinarios como el fosfato y el amonio.', isCorrect: true, rationale: 'Los riñones excretan el exceso de ácidos no volátiles principalmente secretando H<sup>+</sup> en el túbulo renal, donde se unen a tampones como el fosfato (formando H<sub>2</sub>PO<sub>4</sub><sup>-</sup>) y el amonio (NH<sub>4</sub><sup>+</sup>) para ser eliminados en la orina.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'En condiciones fisiológicas el pH arterial es mayor al pH venoso.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'El pH arterial es ligeramente más alto (más alcalino) que el pH venoso porque la sangre arterial tiene una menor P<sub>CO2</sub> (debido a la eliminación de CO<sub>2</sub> en los pulmones), mientras que la sangre venosa ha recogido CO<sub>2</sub> metabólico de los tejidos, lo que la hace más ácida.' },
                { text: 'Falso', isCorrect: false, rationale: 'El pH arterial es ligeramente más alto (más alcalino) que el pH venoso porque la sangre arterial tiene una menor P<sub>CO2</sub> (debido a la eliminación de CO<sub>2</sub> en los pulmones), mientras que la sangre venosa ha recogido CO<sub>2</sub> metabólico de los tejidos, lo que la hace más ácida.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'El sistema tampón bicarbonato es el principal regulador del equilibrio ácido–base extracelular.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'El sistema tampón bicarbonato (HCO<sub>3</sub>⁻/H<sub>2</sub>CO<sub>3</sub>) es el sistema tampón más importante en el líquido extracelular debido a su alta concentración y a que sus componentes pueden ser regulados por los pulmones (CO<sub>2</sub>) y los riñones (HCO<sub>3</sub>⁻).' },
                { text: 'Falso', isCorrect: false, rationale: 'El sistema tampón bicarbonato (HCO<sub>3</sub>⁻/H<sub>2</sub>CO<sub>3</sub>) es el sistema tampón más importante en el líquido extracelular debido a su alta concentración y a que sus componentes pueden ser regulados por los pulmones (CO<sub>2</sub>) y los riñones (HCO<sub>3</sub>⁻).' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'Los riñones corrigen alteraciones ácido–base de forma inmediata.',
            options: [
                { text: 'Verdadero', isCorrect: false, rationale: 'Los riñones son los principales reguladores a largo plazo del equilibrio ácido-base, pero su acción es lenta (horas a días). Los tampones químicos y la compensación respiratoria actúan de forma más inmediata.' },
                { text: 'Falso', isCorrect: true, rationale: 'Los riñones son los principales reguladores a largo plazo del equilibrio ácido-base, pero su acción es lenta (horas a días). Los tampones químicos y la compensación respiratoria actúan de forma más inmediata.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'La hipoventilación prolongada puede generar acidosis respiratoria.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'La hipoventilación reduce la eliminación de CO<sub>2</sub> del cuerpo, lo que lleva a un aumento de la P<sub>CO2</sub> arterial. Un aumento de la P<sub>CO2</sub> aumenta la concentración de H<sub>2</sub>CO<sub>3</sub> y disminuye el pH sanguíneo, causando acidosis respiratoria.' },
                { text: 'Falso', isCorrect: false, rationale: 'La hipoventilación reduce la eliminación de CO<sub>2</sub> del cuerpo, lo que lleva a un aumento de la P<sub>CO2</sub> arterial. Un aumento de la P<sub>CO2</sub> aumenta la concentración de H<sub>2</sub>CO<sub>3</sub> y disminuye el pH sanguíneo, causando acidosis respiratoria.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: '¿Qué tipo de desequilibrio ácido-base se esperaría en un paciente con hiperaldosteronismo primario (exceso de aldosterona)?',
            options: [
                { text: 'Acidosis metabólica.', isCorrect: false, rationale: 'El hiperaldosteronismo causa alcalosis.' },
                { text: 'Alcalosis metabólica.', isCorrect: true, rationale: 'El exceso de aldosterona aumenta la reabsorción de sodio y la secreción de potasio e iones de hidrógeno en los túbulos colectores, lo que lleva a una pérdida de H<sup>+</sup> y una retención neta de bicarbonato, resultando en alcalosis metabólica.' },
                { text: 'Acidosis respiratoria.', isCorrect: false, rationale: 'El hiperaldosteronismo no afecta directamente la ventilación.' },
                { text: 'Alcalosis respiratoria.', isCorrect: false, rationale: 'El hiperaldosteronismo no afecta directamente la ventilación.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'Un paciente con una sobredosis de aspirina (ácido acetilsalicílico) puede presentar inicialmente una alcalosis respiratoria y luego una acidosis metabólica. ¿Cuál es la razón de la acidosis metabólica posterior?',
            options: [
                { text: 'Inhibición de la excreción renal de bicarbonato.', isCorrect: false, rationale: 'La aspirina no inhibe la excreción de bicarbonato de esta manera.' },
                { text: 'Aumento de la producción de ácido láctico y otros ácidos orgánicos debido a la toxicidad de la aspirina.', isCorrect: true, rationale: 'La sobredosis de aspirina (salicilatos) puede desacoplar la fosforilación oxidativa, lo que lleva a un aumento del metabolismo anaeróbico y la producción de ácido láctico, así como a la acumulación de salicilatos que son ácidos, causando una acidosis metabólica con anión gap elevado.' },
                { text: 'Hipoventilación compensatoria severa.', isCorrect: false, rationale: 'La hipoventilación causaría acidosis respiratoria, no metabólica, y no es la causa principal de la acidosis metabólica en este caso.' },
                { text: 'Pérdida renal de iones de hidrógeno.', isCorrect: false, rationale: 'La pérdida de H<sup>+</sup> causaría alcalosis.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: '¿Cuál de los siguientes es el principal tampón extracelular no bicarbonato?',
            options: [
                { text: 'Hemoglobina.', isCorrect: false, rationale: 'La hemoglobina es un tampón intracelular importante.' },
                { text: 'Fosfato.', isCorrect: false, rationale: 'El fosfato es un tampón intracelular y urinario importante.' },
                { text: 'Proteínas plasmáticas.', isCorrect: true, rationale: 'Las proteínas plasmáticas son el principal tampón no bicarbonato en el líquido extracelular.' },
                { text: 'Amonio.', isCorrect: false, rationale: 'El amonio es un tampón urinario.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'El equilibrio ácido-base se mantiene principalmente por la acción coordinada de los sistemas tampón, los pulmones y los riñones.',
            options: [
                { text: 'Verdadero', isCorrect: true, rationale: 'Estos tres sistemas trabajan en conjunto para amortiguar, eliminar y compensar los cambios en el pH sanguíneo.' },
                { text: 'Falso', isCorrect: false, rationale: 'Estos tres sistemas trabajan en conjunto para amortiguar, eliminar y compensar los cambios en el pH sanguíneo.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'En una alcalosis respiratoria, la compensación renal implica:',
            options: [
                { text: 'Aumento de la reabsorción de H<sup>+</sup> y disminución de la excreción de bicarbonato.', isCorrect: false, rationale: 'Esto agravaría la alcalosis.' },
                { text: 'Aumento de la excreción de H<sup>+</sup> y aumento de la reabsorción de bicarbonato.', isCorrect: false, rationale: 'Esto agravaría la alcalosis.' },
                { text: 'Disminución de la reabsorción de bicarbonato y aumento de su excreción.', isCorrect: true, rationale: 'En una alcalosis respiratoria, los riñones compensan disminuyendo la reabsorción de bicarbonato y aumentando su excreción en la orina, lo que ayuda a reducir el pH sanguíneo hacia la normalidad.' },
                { text: 'Aumento de la producción de amonio.', isCorrect: false, rationale: 'La producción de amonio está asociada con la excreción de ácidos, no la compensación de alcalosis.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: '¿Cuál de los siguientes no es un factor que afecte el anión gap?',
            options: [
                { text: 'Concentración de albúmina.', isCorrect: false, rationale: 'La albúmina es una proteína aniónica no medida, por lo que su concentración afecta el anión gap.' },
                { text: 'Concentración de lactato.', isCorrect: false, rationale: 'El lactato es un anión no medido que aumenta el anión gap en acidosis láctica.' },
                { text: 'Concentración de potasio.', isCorrect: true, rationale: 'Aunque el potasio es un catión, su contribución al anión gap es mínima y no se considera un factor que lo afecte significativamente en el cálculo clínico estándar.' },
                { text: 'Concentración de fosfato.', isCorrect: false, rationale: 'El fosfato es un anión no medido que puede afectar el anión gap, especialmente en insuficiencia renal.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'En un paciente con insuficiencia renal crónica, ¿qué desequilibrio ácido-base es más probable que desarrolle?',
            options: [
                { text: 'Alcalosis respiratoria.', isCorrect: false, rationale: 'La insuficiencia renal suele causar acidosis.' },
                { text: 'Acidosis metabólica con anión gap elevado.', isCorrect: true, rationale: 'La insuficiencia renal crónica a menudo lleva a una acidosis metabólica con anión gap elevado debido a la acumulación de ácidos no volátiles (como fosfatos y sulfatos) que los riñones no pueden excretar adecuadamente, y una disminución en la capacidad de generar nuevo bicarbonato.' },
                { text: 'Alcalosis metabólica.', isCorrect: false, rationale: 'La insuficiencia renal suele causar acidosis.' },
                { text: 'Acidosis respiratoria.', isCorrect: false, rationale: 'La insuficiencia renal afecta la función metabólica, no la respiratoria primaria.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'Un paciente con enfermedad pulmonar obstructiva crónica (EPOC) de larga data presenta un pH arterial de 7.33, P<sub>CO2</sub> de 60 mmHg y HCO<sub>3</sub>⁻ de 35 mEq/L. ¿Qué tipo de desequilibrio ácido-base presenta y cuál es el mecanismo compensatorio principal?',
            options: [
                { text: 'Acidosis respiratoria aguda; compensación renal.', isCorrect: false, rationale: 'El pH está cerca de lo normal y el bicarbonato está elevado, lo que indica una condición crónica y compensada, no aguda.' },
                { text: 'Acidosis metabólica; compensación respiratoria.', isCorrect: false, rationale: 'Los valores de PCO2 y bicarbonato son inconsistentes con una acidosis metabólica primaria.' },
                { text: 'Acidosis respiratoria crónica compensada; compensación renal.', isCorrect: true, rationale: 'El pH ligeramente ácido (7.33) con una PCO2 elevada (60 mmHg) indica una acidosis respiratoria. El HCO3⁻ significativamente elevado (35 mEq/L) muestra una compensación renal completa o casi completa, lo que es característico de una acidosis respiratoria crónica (como en la EPOC).' },
                { text: 'Alcalosis metabólica; compensación respiratoria.', isCorrect: false, rationale: 'Los valores de pH y PCO2 son inconsistentes con alcalosis metabólica.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        },
        {
            question: 'Un paciente ingresa con náuseas, vómitos y debilidad. Los electrolitos séricos son: Na<sup>+</sup> 140 mEq/L, K<sup>+</sup> 4.0 mEq/L, Cl<sup>-</sup> 105 mEq/L, HCO<sub>3</sub>⁻ 15 mEq/L. Si el pH arterial es 7.28 y la P<sub>CO2</sub> es 30 mmHg, calcule el anión gap y determine el desequilibrio ácido-base primario.',
            options: [
                { text: 'Anión Gap: 15 mEq/L; Acidosis metabólica con anión gap normal.', isCorrect: false, rationale: 'El cálculo del anión gap es AG = Na<sup>+</sup> - (Cl<sup>-</sup> + HCO<sub>3</sub>⁻) = 140 - (105 + 15) = 140 - 120 = 20 mEq/L. Un anión gap de 15 mEq/L estaría en el límite superior de lo normal, pero 20 mEq/L es elevado.' },
                { text: 'Anión Gap: 20 mEq/L; Acidosis metabólica con anión gap elevado.', isCorrect: true, rationale: 'Cálculo del Anión Gap (AG): AG = Na<sup>+</sup> - (Cl<sup>-</sup> + HCO<sub>3</sub>⁻) = 140 - (105 + 15) = 140 - 120 = 20 mEq/L. Un anión gap normal es de 8-12 mEq/L. Un AG de 20 mEq/L es elevado. El pH bajo (7.28) y el HCO<sub>3</sub>⁻ bajo (15 mEq/L) indican acidosis metabólica. La P<sub>CO2</sub> baja (30 mmHg) indica una compensación respiratoria. Por lo tanto, el diagnóstico es acidosis metabólica con anión gap elevado.' },
                { text: 'Anión Gap: 10 mEq/L; Acidosis metabólica con anión gap normal.', isCorrect: false, rationale: 'El cálculo del anión gap es AG = 20 mEq/L, que es elevado.' },
                { text: 'Anión Gap: 25 mEq/L; Alcalosis metabólica.', isCorrect: false, rationale: 'El cálculo del anión gap es AG = 20 mEq/L. El pH y el bicarbonato son inconsistentes con alcalosis metabólica.' }
            ],
            musicSrc: 'desafio.mp3',
            topic: 'acid_base'
        }
    ];

    // Se filtran las preguntas por tema
    const respiratoryQuestionsFull = allQuestionsData.filter(q => q.topic === 'respiratory');
    const renalQuestionsFull = allQuestionsData.filter(q => q.topic === 'renal');
    const acidBaseQuestionsFull = allQuestionsData.filter(q => q.topic === 'acid_base');

    // Recuento de preguntas por tema (estos console.log reflejarán los números presentes en el array original)
    console.log(`Total de preguntas de Fisiología Respiratoria en el archivo: ${respiratoryQuestionsFull.length}`); // Debería ser 15
    console.log(`Total de preguntas de Fisiología Renal en el archivo: ${renalQuestionsFull.length}`);       // Debería ser 100 (asumiendo tu archivo completo)
    console.log(`Total de preguntas de Equilibrio Ácido-Base en el archivo: ${acidBaseQuestionsFull.length}`); // Debería ser 20

    // Función para mostrar una pantalla específica y ocultar las demás
    function showScreen(screenToShow) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        screenToShow.classList.add('active');
        if (screenToShow !== questionScreen) {
            stopQuestionMusic();
        }
    }

    // Función para iniciar el temporizador
    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = 60;
        timerSpan.textContent = timeLeft;
        timerInterval = setInterval(() => {
            timeLeft--;
            timerSpan.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleAnswer(null); // Tiempo agotado, se considera incorrecta
            }
        }, 1000);
    }

    // Función para reproducir la música de la pregunta
    function playQuestionMusic() {
        const questionData = activeQuestionSet[currentQuestionIndex];
        if (questionData && questionData.musicSrc) {
            questionMusic.src = questionData.musicSrc;
            questionMusic.play().catch(error => {
                console.warn("La reproducción automática de música fue bloqueada por el navegador. Por favor, interactúa con la página para habilitarla.", error);
            });
        } else {
            questionMusic.pause();
            questionMusic.currentTime = 0;
        }
    }

    // Función para detener la música de la pregunta
    function stopQuestionMusic() {
        if (questionMusic) {
            questionMusic.pause();
            questionMusic.currentTime = 0;
        }
    }

    // Función para mostrar la pregunta actual
    function displayQuestion() {
        const totalQuestionsInCurrentSet = activeQuestionSet.length;

        if (currentQuestionIndex < totalQuestionsInCurrentSet) {
            const question = activeQuestionSet[currentQuestionIndex];
            // Muestra el número de pregunta actual de las preguntas seleccionadas
            questionNumberSpan.textContent = `Pregunta ${currentQuestionIndex + 1} de ${totalQuestionsInCurrentSet}`;
            questionTextElement.innerHTML = question.question;

            optionsContainer.innerHTML = '';
            feedbackElement.textContent = '';
            rationaleTextElement.style.display = 'none';
            nextButton.style.display = 'none';

            // Asegura que el botón de inicio de la pregunta esté visible solo en la pantalla de preguntas
            if (homeButtonQuestion) {
                homeButtonQuestion.style.display = 'block';
            }

            question.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.innerHTML = option.text;
                button.classList.add('option-button');
                button.dataset.index = index;
                button.addEventListener('click', () => handleAnswer(index));
                optionsContainer.appendChild(button);
            });

            startTimer();
            playQuestionMusic();
        } else {
            // Fin del conjunto de preguntas actual
            if (currentRoundMode === 'all') {
                // Avanza al siguiente tema en la secuencia
                currentTopicIndexInAllMode++;
                if (currentTopicIndexInAllMode < allTopicsSequence.length) {
                    const nextTopic = allTopicsSequence[currentTopicIndexInAllMode];
                    let nextQuestionsSet;
                    let nextIntroScreen;

                    // Selecciona el conjunto de preguntas aleatorias para el siguiente tema
                    if (nextTopic === 'renal') {
                        nextQuestionsSet = selectedRenalQuestions;
                        nextIntroScreen = renalIntroScreen;
                    } else if (nextTopic === 'acid_base') {
                        nextQuestionsSet = selectedAcidBaseQuestions;
                        nextIntroScreen = acidBaseIntroScreen;
                    }
                    
                    // Reinicia el índice de preguntas para el nuevo set, pero mantiene el score global
                    activeQuestionSet = nextQuestionsSet;
                    currentQuestionIndex = 0;
                    showScreen(nextIntroScreen);
                } else {
                    // Todos los temas han sido completados
                    showResults();
                }
            } else {
                // Modo de ronda única, muestra los resultados
                showResults();
            }
        }
    }

    // Función para manejar la respuesta seleccionada
    function handleAnswer(selectedIndex) {
        clearInterval(timerInterval);
        stopQuestionMusic();

        const question = activeQuestionSet[currentQuestionIndex];
        const selectedOption = (selectedIndex !== null) ? question.options[selectedIndex] : null;
        const correctAnswer = question.options.find(opt => opt.isCorrect);

        document.querySelectorAll('.option-button').forEach((button, index) => {
            button.disabled = true;
            if (question.options[index].isCorrect) {
                button.classList.add('correct');
            } else if (index === selectedIndex) {
                button.classList.add('incorrect');
            }
        });

        if (selectedOption && selectedOption.isCorrect) {
            score++; // Incrementa el score global
            feedbackElement.textContent = '¡Correcto!';
            feedbackElement.className = 'feedback-text correct';
        } else {
            feedbackElement.textContent = 'Incorrecto.';
            feedbackElement.className = 'feedback-text incorrect';
        }

        if (correctAnswer) {
            rationaleTextElement.innerHTML = `<strong>Explicación:</strong> ${correctAnswer.rationale}`;
            rationaleTextElement.style.display = 'block';
        }

        nextButton.style.display = 'block';
    }

    // Función para mostrar la pantalla de resultados finales
    function showResults() {
        showScreen(resultsScreen);
        finalScoreSpan.textContent = score;

        // Calcula el total de preguntas basado en el modo
        let totalQuestionsForResults = 0;
        if (currentRoundMode === 'all') {
            // Suma el total de preguntas seleccionadas aleatoriamente para cada tema
            totalQuestionsForResults = selectedRespiratoryQuestions.length + selectedRenalQuestions.length + selectedAcidBaseQuestions.length;
        } else {
            totalQuestionsForResults = activeQuestionSet.length; // Solo preguntas en el set actual
        }
        totalQuestionsSpan.textContent = totalQuestionsForResults;

        stopQuestionMusic();

        let message = '';
        const percentage = (totalQuestionsForResults > 0) ? (score / totalQuestionsForResults) * 100 : 0;

        if (percentage >= 90) {
            message = '¡Felicidades! ¡Eres un maestro de la Fisiología! ¡Excelente trabajo!';
        } else if (percentage >= 70) {
            message = '¡Muy bien! Tienes un gran conocimiento de Fisiología. ¡Sigue así!';
        } else if (percentage >= 50) {
            message = 'Buen intento. Con un poco más de estudio, ¡dominarás la Fisiología!';
        } else {
            message = 'Debes estudiar más. ¡No te rindas, la Fisiología es fascinante y con esfuerzo lo lograrás!';
        }
        finalMessageElement.textContent = message;

        if (totalQuestionsForResults === 0) {
            finalMessageElement.textContent = 'No hay preguntas cargadas para esta ronda. Por favor, añade preguntas al código.';
        }
        // Asegura que el botón de inicio de la pregunta esté oculto en la pantalla de resultados
        if (homeButtonQuestion) {
            homeButtonQuestion.style.display = 'none';
        }
    }

    // Helper para iniciar una ronda
    function startRound(mode, questionsSetFull, introScreen) {
        currentRoundMode = mode;
        score = 0; // Reinicia el score para cada nueva partida (sea single o all)
        currentQuestionIndex = 0; // Reinicia el índice de preguntas
        currentTopicIndexInAllMode = 0; // Reinicia el índice de tema para el modo 'all'

        // Si es una ronda individual, selecciona preguntas aleatoriamente para ese tema
        if (mode === 'respiratory') {
            activeQuestionSet = getRandomQuestions(questionsSetFull, QUESTIONS_TO_SELECT.respiratory);
        } else if (mode === 'renal') {
            activeQuestionSet = getRandomQuestions(questionsSetFull, QUESTIONS_TO_SELECT.renal);
        } else if (mode === 'acid-base') {
            activeQuestionSet = getRandomQuestions(questionsSetFull, QUESTIONS_TO_SELECT.acid_base);
        } else if (mode === 'all') {
            // Para el modo 'all', pre-selecciona las preguntas para cada tema
            selectedRespiratoryQuestions = getRandomQuestions(respiratoryQuestionsFull, QUESTIONS_TO_SELECT.respiratory);
            selectedRenalQuestions = getRandomQuestions(renalQuestionsFull, QUESTIONS_TO_SELECT.renal);
            selectedAcidBaseQuestions = getRandomQuestions(acidBaseQuestionsFull, QUESTIONS_TO_SELECT.acid_base);
            
            // Inicia con las preguntas de respiratorio para el modo 'all'
            activeQuestionSet = selectedRespiratoryQuestions;
        }

        // Ocultar el botón de inicio de la pregunta al iniciar una ronda
        if (homeButtonQuestion) {
            homeButtonQuestion.style.display = 'none';
        }

        if (introScreen) {
            showScreen(introScreen);
        } else {
            showScreen(questionScreen);
            displayQuestion();
        }
    }

    // Función para volver a la pantalla de inicio y resetear el juego
    function goToStartScreen() {
        clearInterval(timerInterval); // Detiene el temporizador
        stopQuestionMusic(); // Detiene la música
        score = 0; // Reinicia la puntuación
        currentQuestionIndex = 0; // Reinicia el índice de preguntas
        activeQuestionSet = []; // Limpia el conjunto de preguntas activo
        currentRoundMode = 'none'; // Reinicia el modo de ronda
        currentTopicIndexInAllMode = 0; // Reinicia el índice de tema para el modo 'all'
        
        // Limpia los conjuntos de preguntas seleccionadas para el modo 'all'
        selectedRespiratoryQuestions = [];
        selectedRenalQuestions = [];
        selectedAcidBaseQuestions = [];

        showScreen(startScreen); // Muestra la pantalla de inicio

        // Asegura que el botón de inicio de la pregunta esté oculto al volver al inicio
        if (homeButtonQuestion) {
            homeButtonQuestion.style.display = 'none';
        }
    }

    // Event Listeners
    startButton.addEventListener('click', () => {
        goToStartScreen(); // Asegura que el estado se reinicie antes de ir a selección
        showScreen(selectionScreen); // Va a la pantalla de selección
    });

    startAllRoundsButton.addEventListener('click', () => {
        // Inicia el modo 'all' con el primer tema de la secuencia
        startRound('all', null, respiratoryIntroScreen); // questionsSetFull es null aquí porque se maneja internamente
    });

    startRespiratoryButton.addEventListener('click', () => {
        startRound('respiratory', respiratoryQuestionsFull, respiratoryIntroScreen); // Muestra la intro respiratoria
    });

    startRenalButton.addEventListener('click', () => {
        startRound('renal', renalQuestionsFull, renalIntroScreen); // Muestra la intro renal
    });

    startAcidBaseButton.addEventListener('click', () => {
        startRound('acid-base', acidBaseQuestionsFull, acidBaseIntroScreen); // Muestra la intro de ácido-base
    });

    beginRespiratoryButton.addEventListener('click', () => {
        showScreen(questionScreen);
        displayQuestion();
    });

    beginRenalButton.addEventListener('click', () => {
        // En modo 'all', activeQuestionSet ya debería estar configurado por displayQuestion
        // Si no estamos en modo 'all', o si es el inicio de la ronda renal individual
        if (currentRoundMode !== 'all') { // Solo asigna si es una ronda individual
            activeQuestionSet = getRandomQuestions(renalQuestionsFull, QUESTIONS_TO_SELECT.renal); // Selecciona aleatoriamente para ronda individual
            currentQuestionIndex = 0;
        }
        showScreen(questionScreen);
        displayQuestion();
    });

    beginAcidBaseButton.addEventListener('click', () => {
        // En modo 'all', activeQuestionSet ya debería estar configurado por displayQuestion
        // Si no estamos en modo 'all', o si es el inicio de la ronda ácido-base individual
        if (currentRoundMode !== 'all') { // Solo asigna si es una ronda individual
            activeQuestionSet = getRandomQuestions(acidBaseQuestionsFull, QUESTIONS_TO_SELECT.acid_base); // Selecciona aleatoriamente para ronda individual
            currentQuestionIndex = 0;
        }
        showScreen(questionScreen);
        displayQuestion();
    });

    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        displayQuestion(); // displayQuestion maneja la lógica de transición
    });

    restartButton.addEventListener('click', () => {
        goToStartScreen(); // Vuelve a la pantalla de inicio y resetea
    });

    // Event listener para el botón "Inicio" en la pantalla de preguntas
    if (homeButtonQuestion) {
        homeButtonQuestion.addEventListener('click', goToStartScreen);
    }
    // Si deseas mantener un botón de inicio en la pantalla de resultados también:
    if (homeButtonResults) {
        homeButtonResults.addEventListener('click', goToStartScreen);
    }


    // Mostrar la pantalla de inicio al cargar
    showScreen(startScreen);
});
