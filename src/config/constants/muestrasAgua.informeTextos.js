export const FACTORES_CALIDAD_AGUA = [
    {
        titulo: "1. pH",
        texto: "Indica el grado de acidez o alcalinidad del agua. El valor inicial orienta sobre su comportamiento, pero no debe analizarse de manera aislada: para la aplicación interesa especialmente el pH final del caldo, la capacidad buffer y la sensibilidad de los productos incorporados."
    },

    {
        titulo: "2. Conductividad eléctrica ",
        texto: "Es una medida indirecta de la cantidad de iones disueltos. Una conductividad elevada indica una mayor carga salina y advierte que el agua requiere una evaluación más detallada. No identifica por sí sola qué iones están presentes ni su efecto específico."
    },

    {
        titulo: "3. Dureza",
        texto: "Está determinada principalmente por calcio (Ca+2) y magnesio (Mg+2). Estos cationes pueden interactuar con determinados principios activos, afectar tensioactivos y disminuir la estabilidad de emulsiones y suspensiones. El riesgo depende también del producto, la formulación, la mezcla y el volumen de agua."
    },

    {
        titulo: "4. Alcalinidad",
        texto: "Representa la capacidad del agua para amortiguar cambios de pH y está asociada principalmente a carbonatos y bicarbonatos. Una alcalinidad elevada puede dificultar la modificación del pH final del caldo, pero no implica por sí sola que el agua necesite un corrector de dureza."
    },

    {
        titulo: "5. Salinidad",
        texto: "Expresa la concentración total estimada de sales disueltas. Una salinidad elevada puede afectar la actividad de los principios activos y disminuir la estabilidad de algunas formulaciones, especialmente en caldos concentrados y aplicaciones de bajo volumen."

        // subsecciones: [
        //     {
        //         subtitulo: "La salinidad afecta de dos formas:",
        //         items: [
        //             "Solubilidad del ion: mayor solubilidad del ion.",
        //             "Menor estabilidad de las formulaciones: las sales presentes generan un apantallamiento de la carga de los iones, perdiéndose la fuerza de repulsión y generando efectos similares a la dureza en la formulación. Las emulsiones son las más afectadas (graminicidas, S-metolacloro, insecticidas, 2-4D ácido o etil hexil)."
        //         ]
        //     }
        //     ]
    },
    {
        titulo: "6. Fuerza iónica",
        texto: "Considera simultáneamente la concentración y la carga eléctrica de los iones. Cuando aumenta, puede reducir la repulsión entre micelas o partículas y favorecer agregación, floculación o separación de fases. Está relacionada con la salinidad, pero no es la misma variable."
    },

    {
        titulo: "¿Cómo puede afectar la calidad del agua?",
        texto: "Un agua dura o salina puede hacer que una formulación de buena calidad pierda estabilidad y se comporte en el caldo como una formulación de menor calidad.",
        subsecciones: [
            {
                subtitulo: "Esto puede observarse especialmente en:",
                items: ["Mezclas complejas. ", "Suspensiones concentradas (SC). ", "Concentrados emulsionables (CE), entre ellos los graminicidas. "],

            },
            {
                subtitulo: "Si el control es deficiente, también se debe revisar: la calidad de la formulación, el volumen de aplicación por hectárea, la tecnología y calidad de aplicación, el estado de las malezas y las condiciones ambientales.",
                items: [],

            }
        ]
    },

    {
        titulo: "Evaluación demostrativa utilizando agua dura y salada de referencia",
        texto: "Para visualizar el efecto de la calidad del agua sobre los fitosanitarios, se evaluó el comportamiento de una formulación de cletodim utilizando un agua con elevada dureza, salinidad y fuerza iónica. Se compararon dos tratamientos: cletodim incorporado directamente al agua y cletodim luego de acondicionar el agua con Hard."
    },

];