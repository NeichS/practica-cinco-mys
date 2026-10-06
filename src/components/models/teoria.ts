import type { Teoria } from "./types"

const r = String.raw

export const TEORIA: Record<string, Teoria> = {
  enfriamiento: {
    resumen: r`Describe cómo cambia la temperatura de un objeto que intercambia calor con un medio a temperatura constante: un café que se enfría o una bebida fría que se calienta. La idea es que el objeto pierde (o gana) calor más rápido cuanto mayor es su diferencia de temperatura con el ambiente.`,
    practica: {
      sirve: r`Predecir **cuánto tarda** un objeto en enfriarse o calentarse hasta una temperatura dada, o al revés, deducir **cuánto tiempo pasó** a partir de la temperatura que tiene ahora.`,
      resuelve: [
        r`**En la cocina:** ¿en cuántos minutos el café baja de 90 °C a 60 °C para poder tomarlo? Con $k = 0.1$ y una habitación a 20 °C, unos 5.6 minutos.`,
        r`**Medicina forense:** estimar la hora de muerte a partir de la temperatura del cuerpo y la del ambiente.`,
        r`**Alimentos e industria:** cuánto tiempo hay que dejar algo en la heladera o el freezer hasta que llegue a una temperatura segura, o comparar aislantes (un termo tiene $k$ chico).`,
      ],
    },
    formulas: [
      {
        nombre: "Ecuación diferencial",
        tex: r`\frac{dT}{dt} = -k\,(T - T_{amb})`,
        texto: r`Es el modelo en sí: dice que la **velocidad** de cambio de la temperatura es proporcional a la diferencia con el ambiente. El signo menos hace que, con $k>0$, la temperatura siempre se acerque a $T_{amb}$: si el objeto está más caliente, $dT/dt<0$ y se enfría; si está más frío, se calienta.`,
      },
      {
        nombre: "Solución analítica",
        tex: r`T(t) = T_{amb} + (T_0 - T_{amb})\,e^{-kt}`,
        texto: r`Se obtiene separando variables y sirve para calcular la temperatura **en cualquier instante** sin simular. Muestra que la diferencia $T - T_{amb}$ decae exponencialmente y que $T \to T_{amb}$ cuando $t \to \infty$. En la app es la línea continua contra la que se comparan los puntos de RK4.`,
      },
      {
        nombre: "Constante de tiempo",
        tex: r`\tau = \frac{1}{k}`,
        texto: r`Da la **escala de tiempo** del proceso. En $t=\tau$ la diferencia con el ambiente bajó al 36.8 % (se recorrió el 63 % del camino) y en $5\tau$ queda menos del 1 %. Sirve para responder rápido "¿cuánto tarda más o menos?".`,
      },
      {
        nombre: "Semivida de la diferencia",
        tex: r`t_{1/2} = \frac{\ln 2}{k}`,
        texto: r`Tiempo en que la diferencia $T - T_{amb}$ se reduce a la mitad. No depende de $T_0$ ni de $T_{amb}$: cada $t_{1/2}$ minutos la distancia al ambiente se divide por 2.`,
      },
      {
        nombre: "Pendiente inicial",
        tex: r`\dot T(0) = -k\,(T_0 - T_{amb})`,
        texto: r`Velocidad de enfriamiento en el primer instante (°C/min). Sirve para ver que un objeto más caliente, o un $k$ más grande, se enfría más rápido al principio.`,
      },
      {
        nombre: "Tiempo hasta una temperatura objetivo",
        tex: r`t^* = \frac{1}{k}\ln\frac{T_0 - T_{amb}}{T^* - T_{amb}}`,
        texto: r`Sale de despejar $t$ de la solución analítica. Responde "¿cuánto tarda el café en llegar a $T^*$?". Si $T^*$ está del otro lado de $T_{amb}$ el objeto nunca llega, porque la curva se acerca a $T_{amb}$ sin cruzarla.`,
      },
      {
        nombre: "Forma normalizada",
        tex: r`\frac{T - T_{amb}}{T_0 - T_{amb}} = e^{-kt}`,
        texto: r`Al normalizar desaparecen $T_0$ y $T_{amb}$ y solo queda $k$. Sirve para ver que $k$ es el único parámetro que define la **dinámica** (cuánto tarda y si es estable); $T_0$ y $T_{amb}$ solo fijan entre qué valores ocurre.`,
      },
    ],
    lectura: [
      r`La línea azul es la solución exacta y los puntos naranjas son RK4: si coinciden, el método numérico es correcto (el error se muestra en la última tarjeta).`,
      r`La línea horizontal punteada es $T_{amb}$, la asíntota a la que tiende la curva. La vertical marca $t=\tau$.`,
      r`Con $k<0$ (preset "k < 0") la diferencia **crece** exponencialmente: el equilibrio se vuelve inestable y el modelo deja de ser físico, porque el calor pasaría del cuerpo frío al caliente.`,
      r`En "Superponer curvas" → **familia de soluciones** se dibuja $T = T_{amb} + C\,e^{-kt}$ para varios $C = T_0 - T_{amb}$: es la solución general de la EDO, y cada condición inicial elige una curva. Todas tienden a $T_{amb}$ y nunca se cruzan (unicidad de la solución).`,
      r`Con **familia de k** todas las curvas parten de $T_0$ y llegan a $T_{amb}$; $k$ solo cambia qué tan rápido.`,
    ],
  },

  malthus: {
    resumen: r`Modelo más simple de crecimiento de una población: supone recursos ilimitados, así que la cantidad de nacimientos menos muertes por unidad de tiempo es proporcional a la población actual.`,
    practica: {
      sirve: r`Proyectar cómo evoluciona **cualquier cantidad que crece (o decrece) a un ritmo proporcional a sí misma**, mientras no haya límites de recursos.`,
      resuelve: [
        r`**Demografía:** ¿cuándo se duplica una población que crece 3 % anual? En $\ln 2 / 0.03 \approx 23$ años.`,
        r`**Biología:** crecimiento de bacterias en un cultivo en su etapa inicial, antes de que se agoten los nutrientes.`,
        r`**Finanzas:** es la misma ecuación que el interés compuesto continuo: un capital al $r$ % anual crece como $P_0 e^{rt}$.`,
      ],
    },
    formulas: [
      {
        nombre: "Ecuación diferencial",
        tex: r`\frac{dP}{dt} = r\,P`,
        texto: r`Dice que la población crece a una tasa proporcional a su tamaño. $r$ es la tasa neta (natalidad menos mortalidad) por año: $r>0$ crecimiento, $r<0$ extinción, $r=0$ población constante.`,
      },
      {
        nombre: "Solución analítica",
        tex: r`P(t) = P_0\,e^{rt}`,
        texto: r`Sirve para predecir la población en cualquier año. El crecimiento es **exponencial**: cada intervalo de tiempo igual, la población se multiplica por el mismo factor $e^{r\Delta t}$.`,
      },
      {
        nombre: "Tiempo de duplicación",
        tex: r`t_d = \frac{\ln 2}{r}`,
        texto: r`Cuántos años tarda la población en duplicarse. Sale de plantear $P_0e^{rt_d} = 2P_0$ y **no depende de $P_0$**: una población de 10 y una de 10 millones se duplican en el mismo tiempo. Con $r=3\%$, $t_d \approx 23$ años. Si $r<0$, la misma fórmula con $|r|$ da el tiempo en que la población se reduce a la mitad.`,
      },
      {
        nombre: "Forma logarítmica",
        tex: r`\ln P(t) = \ln P_0 + r\,t`,
        texto: r`Tomando logaritmo, la exponencial se vuelve una **recta de pendiente $r$**. Sirve para reconocer crecimiento exponencial en datos reales y para estimar $r$ como la pendiente en un gráfico semilogarítmico.`,
      },
    ],
    lectura: [
      r`Las líneas verticales punteadas están separadas por $t_d$: entre cada par de líneas la población se duplica.`,
      r`Activá "Eje vertical logarítmico" para ver la curva convertida en recta; cambiá $r$ y mirá cómo cambia la pendiente.`,
      r`"Superponer curvas" → **familia de soluciones** dibuja $P = C\,e^{rt}$ para varias poblaciones iniciales: en escala log son rectas **paralelas** (misma pendiente $r$). Con **familia de r** las rectas cambian de pendiente.`,
      r`Limitación: el modelo crece sin límite, lo que deja de ser realista en tiempos largos. El modelo logístico de Verhulst agrega una capacidad máxima.`,
    ],
  },

  decaimiento: {
    resumen: r`Cada núcleo radiactivo tiene una probabilidad fija de desintegrarse por unidad de tiempo, así que la cantidad que decae es proporcional a la cantidad que queda. Es la misma ecuación que Malthus con tasa negativa, y es la base de la datación por carbono-14.`,
    practica: {
      sirve: r`Saber **cuánto material radiactivo queda** después de un tiempo, o al revés, **cuánto tiempo pasó** midiendo cuánto queda.`,
      resuelve: [
        r`**Arqueología:** datación por carbono-14. Un hueso que conserva el 30 % de su C-14 tiene unos 9950 años.`,
        r`**Medicina nuclear:** cuánta actividad de yodo-131 le queda a un paciente después de un tratamiento; a los 8 días, la mitad.`,
        r`**Residuos nucleares:** cuánto tiempo hay que almacenar el cesio-137. Tras 10 semividas (≈ 300 años) queda el 0.1 %.`,
      ],
    },
    formulas: [
      {
        nombre: "Ecuación diferencial",
        tex: r`\frac{dN}{dt} = -\lambda\,N`,
        texto: r`$N$ es la cantidad de núcleos sin decaer y $\lambda$ la **constante de desintegración** (probabilidad de decaer por unidad de tiempo). El signo menos indica que $N$ siempre disminuye.`,
      },
      {
        nombre: "Solución analítica",
        tex: r`N(t) = N_0\,e^{-\lambda t}`,
        texto: r`Permite calcular cuánto material queda en cualquier momento. En la app se grafica $N/N_0$ (fracción restante), que va de 1 a 0 sin depender de $N_0$.`,
      },
      {
        nombre: "Actividad",
        tex: r`A(t) = \left|\frac{dN}{dt}\right| = \lambda\,N(t)`,
        texto: r`Cantidad de **desintegraciones por unidad de tiempo** (en el SI se mide en becquerel, 1 Bq = 1 desintegración/s). Es proporcional a $N$: con el doble de sustancia hay el doble de desintegraciones por segundo, pero la **proporción** $A/N = \lambda$ es siempre la misma. Por eso más sustancia no se "vacía" más rápido en porcentaje y $T_{1/2}$ no depende de $N_0$.`,
      },
      {
        nombre: "Período de semidesintegración",
        tex: r`T_{1/2} = \frac{\ln 2}{\lambda}`,
        texto: r`Tiempo en que la mitad de los núcleos decae. Es el dato que se tabula para cada isótopo (5730 años para el C-14) y la fórmula sirve para pasar de $T_{1/2}$ a $\lambda$ y viceversa.`,
      },
      {
        nombre: "Vida media",
        tex: r`\tau = \frac{1}{\lambda}`,
        texto: r`Tiempo de vida **promedio** de un núcleo. Es mayor que $T_{1/2}$ ($\tau \approx 1.44\,T_{1/2}$); en $t=\tau$ queda el 36.8 % del material.`,
      },
      {
        nombre: "Fracción tras n semividas",
        tex: r`\frac{N(nT_{1/2})}{N_0} = \frac{1}{2^n}`,
        texto: r`Regla rápida: después de 1, 2, 3… semividas queda la mitad, un cuarto, un octavo… Las líneas verticales del gráfico marcan esos instantes.`,
      },
      {
        nombre: "Datación",
        tex: r`t = \frac{1}{\lambda}\ln\frac{N_0}{N}`,
        texto: r`Despejando $t$: si se mide qué fracción $N/N_0$ del isótopo queda en una muestra, se obtiene su **edad**. Es como se fechan restos orgánicos con C-14. Probalo con el slider "Fracción remanente".`,
      },
      {
        nombre: "Probabilidad de decaer en un paso (Monte Carlo)",
        tex: r`p = 1 - e^{-\lambda\,\Delta t}`,
        texto: r`Probabilidad de que **un** núcleo decaiga en un intervalo $\Delta t$. La simulación Monte Carlo sortea cada paso cuántos núcleos decaen con esa probabilidad. Sirve para mostrar que la EDO describe el **valor esperado** de un proceso que en realidad es aleatorio.`,
      },
    ],
    lectura: [
      r`Línea azul: solución exacta. Puntos: RK4. Escalones verdes: Monte Carlo con $n$ núcleos.`,
      r`Con pocos núcleos (bajá "Núcleos Monte Carlo" a 50) el Monte Carlo fluctúa mucho alrededor de la curva; con muchos se pega a ella. Cambiá la semilla para obtener otra realización del azar.`,
      r`La línea horizontal en 0.5 corta a la curva exactamente en $t = T_{1/2}$.`,
      r`Gráficos de **actividad**: con $2N_0$ la curva arranca al doble de altura (el doble de desintegraciones por unidad de tiempo), pero las tres curvas bajan a la mitad en el mismo $T_{1/2}$. En "Actividad en función de los núcleos" la relación $A = \lambda N$ es una recta por el origen: esa recta **es** la proporcionalidad.`,
      r`"Superponer curvas" → **familia de soluciones** dibuja $N = C\,e^{-\lambda t}$ para varias cantidades iniciales: cada una se reduce a la mitad en el mismo $T_{1/2}$. Con **familia de T½** se comparan isótopos más rápidos y más lentos.`,
    ],
  },

  sistemas: {
    resumen: r`Un sistema de dos ecuaciones lineales acopladas: la derivada de cada variable es una combinación lineal de $x$ e $y$. Toda la información está en la matriz $A$: sus autovalores deciden si las soluciones crecen, decaen u oscilan, y el diagrama en bloques muestra cómo se implementaría con integradores, sumadores y ganancias.`,
    practica: {
      sirve: r`Analizar **cualquier sistema de dos variables que se influyen entre sí** y saber, sin resolverlo, si vuelve al equilibrio, se aleja u oscila: alcanza con mirar los autovalores de $A$.`,
      resuelve: [
        r`**Ingeniería mecánica y eléctrica:** un resorte con amortiguador o un circuito RLC se escriben así. Los autovalores dicen si oscila, si se amortigua o si se vuelve inestable.`,
        r`**Control y simulación:** el diagrama en bloques es exactamente cómo se arma el sistema en Simulink, Xcos o con electrónica analógica (integradores, sumadores y ganancias).`,
        r`**Sistemas no lineales:** cerca de un equilibrio, cualquier sistema se aproxima por uno lineal (linealización), y se clasifica igual. Es lo que se hace en el Ejercicio 5.`,
      ],
    },
    formulas: [
      {
        nombre: "Forma matricial",
        tex: r`\dot{\mathbf z} = A\,\mathbf z,\qquad \mathbf z = \begin{pmatrix}x\\y\end{pmatrix}`,
        texto: r`Escribe las dos ecuaciones en una sola. Cada coeficiente $a_{ij}$ indica cuánto influye la variable $j$ en la derivada de la variable $i$: $a_{11}, a_{22}$ son la **realimentación propia** y $a_{12}, a_{21}$ el **acoplamiento cruzado**.`,
      },
      {
        nombre: "Diagrama en bloques",
        tex: r`x(t) = x_0 + \int_0^t \dot x\,d\tau`,
        texto: r`Cada variable de estado sale de un **integrador**, cuya entrada es su derivada. Un **sumador** $\Sigma$ arma esa derivada sumando las salidas multiplicadas por las **ganancias** $a_{ij}$. Así se representa (y se simula) el sistema como un circuito de señales.`,
      },
      {
        nombre: "Autovalores",
        tex: r`\det(A - \lambda I) = \lambda^2 - \operatorname{tr}(A)\,\lambda + \det(A) = 0`,
        texto: r`Las raíces $\lambda_1, \lambda_2$ son las "tasas" naturales del sistema: las soluciones son combinaciones de $e^{\lambda t}$. Parte real negativa ⇒ decae; positiva ⇒ crece; parte imaginaria ⇒ oscila.`,
      },
      {
        nombre: "Traza, determinante y discriminante",
        tex: r`\operatorname{tr}A = \lambda_1 + \lambda_2,\quad \det A = \lambda_1\lambda_2,\quad \Delta = \operatorname{tr}^2 - 4\det`,
        texto: r`Permiten **clasificar el equilibrio sin calcular los autovalores**: $\det<0$ ⇒ punto silla; $\det>0$ y $\Delta<0$ ⇒ foco (espiral); $\det>0$ y $\Delta>0$ ⇒ nodo; $\operatorname{tr}<0$ ⇒ estable, $\operatorname{tr}>0$ ⇒ inestable, $\operatorname{tr}=0$ ⇒ centro; $\det=0$ ⇒ recta de equilibrios.`,
      },
      {
        nombre: "Solución general (autovalores reales distintos)",
        tex: r`\mathbf z(t) = C_1 e^{\lambda_1 t}\mathbf v_1 + C_2 e^{\lambda_2 t}\mathbf v_2`,
        texto: r`La solución es una mezcla de dos movimientos sobre las rectas de los **autovectores** $\mathbf v_1, \mathbf v_2$ (líneas punteadas en el plano de fase). Las constantes $C_1, C_2$ salen de la condición inicial.`,
      },
      {
        nombre: "Exponencial de matriz",
        tex: r`\mathbf z(t) = e^{At}\,\mathbf z_0`,
        texto: r`Fórmula general válida para cualquier $A$ (autovalores complejos, repetidos, etc.). La app la usa para calcular la solución **exacta** que se compara con la simulación del diagrama.`,
      },
      {
        nombre: "Simulación del diagrama (Euler)",
        tex: r`\mathbf z_{n+1} = \mathbf z_n + h\,A\,\mathbf z_n`,
        texto: r`Es lo que hacen los integradores del diagrama en tiempo discreto: los sumadores calculan $A\mathbf z_n$ y los integradores acumulan $h$ veces ese valor. Achicar $h$ reduce el error.`,
      },
    ],
    lectura: [
      r`Elegí los sistemas (a)–(f) del práctico o mové los coeficientes: el diagrama en bloques se redibuja (si un $a_{ij}=0$ su bloque desaparece) y la clasificación se actualiza.`,
      r`En el plano de fase, las flechas son el campo de direcciones $(\dot x, \dot y)$, las curvas naranjas son trayectorias de prueba y la azul es la de $(x_0, y_0)$. Hacé clic en el plano para cambiar la condición inicial.`,
      r`"Familia de trayectorias" muestra varias soluciones del mismo sistema con distintas condiciones iniciales: juntas forman el **retrato de fase**. La grilla densa integra cada punto hacia adelante y hacia atrás, útil para ver las separatrices de un punto silla.`,
      r`En la respuesta temporal, las líneas son la solución exacta y los puntos la simulación del diagrama con Euler. Subí $h$ para ver cómo crece el error.`,
    ],
  },

  "lotka-volterra": {
    resumen: r`Modelo clásico de dos especies que interactúan: presas $x$ (por ejemplo conejos) y depredadores $y$ (zorros). Las presas crecen solas y son comidas; los depredadores mueren solos y se reproducen comiendo. El resultado son oscilaciones periódicas de ambas poblaciones.`,
    practica: {
      sirve: r`Entender y predecir la dinámica de **dos poblaciones que dependen una de la otra**: por qué oscilan, con qué período y alrededor de qué valores.`,
      resuelve: [
        r`**Ecología:** explica ciclos reales como los de liebres y linces en Canadá, que suben y bajan con un desfase de varios años.`,
        r`**Pesca:** el propio Volterra lo usó para explicar por qué, cuando se pescó menos en el Adriático durante la Primera Guerra Mundial, aumentó la proporción de tiburones.`,
        r`**Control de plagas:** anticipar qué pasa al introducir un depredador o aplicar un insecticida que afecta a ambas especies; a veces la plaga termina aumentando en promedio.`,
      ],
    },
    formulas: [
      {
        nombre: "Ecuación de las presas",
        tex: r`\dot x = \alpha x - \beta x y`,
        texto: r`$\alpha x$: sin depredadores las presas crecen como en Malthus, con tasa $\alpha$. $-\beta xy$: pérdidas por predación, proporcionales a la cantidad de **encuentros** entre presas y depredadores ($x\cdot y$).`,
      },
      {
        nombre: "Ecuación de los depredadores",
        tex: r`\dot y = \delta x y - \gamma y`,
        texto: r`$\delta xy$: los depredadores se reproducen según cuánto comen ($\delta$ mide la conversión de presas en nuevos depredadores). $-\gamma y$: sin presas mueren exponencialmente con tasa $\gamma$.`,
      },
      {
        nombre: "Equilibrio de coexistencia",
        tex: r`(x^*, y^*) = \left(\frac{\gamma}{\delta},\ \frac{\alpha}{\beta}\right)`,
        texto: r`Poblaciones en las que ambas derivadas son cero y nada cambia (★ en el plano de fase). Curiosamente, la cantidad de presas en equilibrio depende de los parámetros de los **depredadores** y viceversa. También es el **promedio** de cada población a lo largo de un ciclo.`,
      },
      {
        nombre: "Equilibrio de extinción",
        tex: r`(0,0):\ \lambda_1 = \alpha > 0,\ \lambda_2 = -\gamma < 0`,
        texto: r`Con autovalores de distinto signo es un **punto silla**: inestable. Sin depredadores las presas explotan; sin presas los depredadores se extinguen.`,
      },
      {
        nombre: "Jacobiano",
        tex: r`J = \begin{pmatrix}\alpha-\beta y & -\beta x\\ \delta y & \delta x-\gamma\end{pmatrix}`,
        texto: r`Matriz de derivadas parciales. Sirve para **linealizar** el sistema cerca de cada equilibrio y clasificarlo con las mismas reglas que en el Ejercicio 4.`,
      },
      {
        nombre: "Período de oscilaciones pequeñas",
        tex: r`T \approx \frac{2\pi}{\sqrt{\alpha\gamma}}`,
        texto: r`En $(x^*, y^*)$ los autovalores son $\pm i\sqrt{\alpha\gamma}$ (un **centro**), así que cerca del equilibrio las poblaciones oscilan con ese período. Lejos del equilibrio el período real es mayor porque el modelo es no lineal (comparalo con el "observado").`,
      },
      {
        nombre: "Cantidad conservada",
        tex: r`V(x,y) = \delta x - \gamma\ln x + \beta y - \alpha\ln y = \text{cte.}`,
        texto: r`Se obtiene dividiendo las dos ecuaciones y separando variables. $V$ no cambia a lo largo de una trayectoria, por eso las órbitas son **curvas cerradas**: las oscilaciones se repiten para siempre. Como no hay fórmula cerrada para $x(t), y(t)$, $V$ sirve para **medir la precisión** del método numérico: cuanto más se aparta de $V_0$, peor.`,
      },
    ],
    lectura: [
      r`Evolución temporal: el pico de depredadores llega **después** del de presas (≈ 1/4 de ciclo de desfase).`,
      r`Plano de fase: con "Comparar Euler vs RK4" activado, Euler (naranja) se abre en espiral porque agrega "energía" en cada paso, mientras que RK4 se mantiene sobre la órbita. Es un error del método, no del modelo.`,
      r`"Familia de órbitas": cada órbita gris es una curva de nivel $V(x,y) = c$ distinta; cuanto más lejos del equilibrio, mayor la amplitud y el período de la oscilación.`,
      r`Deriva de $V$: escala logarítmica del error $|V - V_0|$. Euler queda varios órdenes de magnitud por encima de RK4; probá cambiar $h$.`,
    ],
  },
}
