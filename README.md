# GeoFlags

App móvil (Android / iOS / web) para aprender banderas, capitales, formas y la
ubicación de países y territorios. Diseño limpio, funciona sin conexión.

Hecha con **Expo (React Native) + TypeScript** y Expo Router.

## Qué incluye

### 349 banderas

| Grupo | Nº | Contenido |
|---|---:|---|
| Base | 254 | Los 249 códigos ISO 3166-1 (193 estados de la ONU, Vaticano, Palestina, territorios dependientes…) + Kosovo + Inglaterra, Escocia, Gales e Irlanda del Norte |
| No reconocidos / reconocimiento limitado | +8 | Abjasia, Osetia del Sur, Transnistria, Somalilandia, Chipre del Norte, Circasia, Ichkeria, Sealand (además de Kosovo, Taiwán, Palestina y Sahara Occidental de la base) |
| Comunidades autónomas | 19 | Las 17 comunidades + Ceuta y Melilla |
| Históricas | 32 | URSS, Yugoslavia, RDA, Imperio alemán y ruso, II República, Zaire, Rodesia, Vietnam del Sur, Biafra, Artsaj, Texas, Hawái… |
| Pueblos y regiones culturales | 23 | Kurdistán, Tíbet, sami, gitano, aborígenes australianos, Bretaña, Córcega, Cerdeña, wiphala, amazigh, maorí… |
| Organizaciones | 13 | UE, ONU, OTAN, Liga Árabe, ASEAN, Juegos Olímpicos, Cruz Roja… |

En **Jugar → Banderas en juego** se elige con qué banderas se juega: todas, las
254, solo Europa, solo históricas, etc., o cualquier combinación de tipos y
continentes. Esa selección se aplica a todos los juegos.

### Test personalizado (cualquier combinación)

Se elige qué se enseña (**bandera, nombre, capital o forma**) y con qué se
responde (**bandera, nombre, capital, forma o mapa**), y cómo: 4 opciones,
escribir (acepta pequeñas erratas) o tocar en el mapa.

Las opciones incorrectas se eligen entre las **banderas más parecidas** (por
colores y por disposición, incluidas las que son una la imagen especular de la
otra, como Irlanda y Costa de Marfil). Se puede desactivar en Progreso → Ajustes.

Modos: **Clásico**, **Supervivencia** (3 vidas), **Contrarreloj** (60 s) y
**Racha** (un fallo y se acaba). Las preguntas priorizan las banderas que fallas
y las que todavía no has visto.

### Juegos

- **Completa la región**: escribe todos los países de un continente, región o grupo (con las banderas como pista, si quieres).
- **Pixelada o zoom**: la bandera se va revelando; cuanto antes aciertes, más puntos.
- **Construye la bandera**: elige la orientación, el número de franjas y sus colores (banderas de franjas detectadas automáticamente).
- **Encuentra el error**: entre cuatro versiones (colores cambiados o intercambiados, imagen especular), ¿cuál es la correcta?
- **Worldle**: adivina por la silueta; cada intento te da la distancia, la dirección y la proximidad.
- **Cadena de vecinos**: ve de un país a otro pasando solo por fronteras terrestres.
- **Ordenar**: por población, superficie, latitud o longitud.

### Glosario y progreso

- Glosario con buscador y filtros por tipo, continente y **colores**. Cada ficha muestra capital, población, superficie, proporción, colores, forma, ubicación, fronteras, banderas iguales y parecidas, y tu nivel.
- Progreso: aciertos, nivel de dominio por bandera y por grupo, banderas para repasar y récords.
- Ajuste para ver las banderas con su **proporción real** (Nepal, Suiza, Catar…) o todas en 3:2.

## Probarla

```bash
npm install
npx expo start
```

- **En el móvil**: instala *Expo Go* y escanea el código QR. Todos los módulos que usa la app vienen incluidos en Expo Go.
- **En el navegador**: pulsa `w` en la terminal.

### Instalarla en Android (APK)

Cada push a `main` (o a una rama `claude/…`) compila el APK con GitHub Actions
(`.github/workflows/android-apk.yml`) y lo publica en la release
**[apk-latest](https://github.com/Angel24a/geoflags/releases/tag/apk-latest)**.
Abre ese enlace en el móvil, descarga `geoflags.apk` e instálalo (acepta instalar
apps de origen desconocido). También se puede lanzar a mano desde la pestaña
*Actions → Android APK → Run workflow*.

Alternativa con la nube de Expo: `npx eas-cli@latest build -p android --profile preview`.
En iPhone, sin la cuenta de desarrollador de Apple (99 $/año) se puede usar con Expo Go.

## Desarrollo

```bash
npm run typecheck   # TypeScript
npm test            # tests unitarios (Jest)
npm run build:data  # regenera src/data/generated/*
```

### Estructura

```
data/                 fuentes propias: banderas extra (SVG generados por código), nombres en español, población
scripts/build-data.ts genera los datos de la app
src/data/generated/   entities.json, flags.json (SVG optimizados), pixels.json, geo.json (TopoJSON)
src/lib/              lógica sin interfaz: quiz, texto, geo, cadena, variantes, filtros…
src/components/       Flag, ShapeView, WorldMap, RevealFlag, ui, game
src/app/              pantallas (Expo Router)
__tests__/            tests
```

### Cómo se generan los datos

`npm run build:data`:

1. Junta las entidades (ISO + extras) con nombres y capitales en español.
2. Optimiza cada SVG con SVGO (prefijando los ids para que no choquen).
3. Rasteriza cada bandera (resvg) y calcula:
   - una cuadrícula de 24×16 píxeles para el modo pixelado;
   - un histograma sobre 10 colores con nombre (en espacio CIELAB);
   - una distancia entre banderas = 0,6 · diferencia espacial (ΔE medio en una cuadrícula de 12×8, también contra la imagen especular) + 0,4 · diferencia de histogramas. Así se obtienen las 15 banderas más parecidas;
   - los grupos de banderas idénticas: casi el mismo color exacto, o el mismo color con nombre en más del 99,5 % de la superficie (Chad y Rumanía, Alto Volta e Imperio alemán). Nunca salen juntas como opciones;
   - las franjas (orientación, colores y grosores) cuando la bandera es solo de franjas;
   - si es simétrica, para no usar la imagen especular como "error".
4. Geometría de Natural Earth (`world-atlas`): resolución 1:50m para los países grandes y 1:10m para los pequeños; separa los territorios de ultramar de su país (Guayana Francesa, Martinica, Svalbard…) y simplifica cada territorio con Douglas–Peucker en proporción a su tamaño.

Algunas banderas dibujadas a mano tienen el escudo o emblema **simplificado**
(se indica en su ficha). Para sustituir cualquier bandera (también las 254
base), deja un SVG en `data/flags/<id>.svg` y vuelve a ejecutar
`npm run build:data`. Si un archivo no corresponde a ningún id, el script falla
y lo indica.

## Modo online

Pestaña **Online** (necesita conexión):

- **Reto diario**: 10 preguntas iguales para todos cada día (el tipo cambia a diario), un solo intento y clasificación del día.
- **Duelo en directo**: el anfitrión crea una sala con un código de 4 letras, elige el tipo de partida y las banderas; los demás entran con el código y todos juegan las mismas preguntas a la vez, viendo la puntuación de los rivales en directo. Puntúa acertar (100) y la rapidez (hasta +50).
- **Retar a amigos**: juegas una partida, compartes el código de 6 letras y tus amigos juegan exactamente la misma cuando quieran.
- **Clasificación**: las mejores marcas de supervivencia, contrarreloj y racha se suben solas (por tipo de test y grupo de banderas).

Las partidas compartidas se generan con una semilla (`src/lib/online/seeded.ts`), así que todos ven las mismas preguntas y opciones. El servidor es **Supabase** (plan gratuito):

### Configurar Supabase (una vez, ~5 minutos)

1. Crea una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo (gratis).
2. En el proyecto: **SQL Editor → New query**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
3. En **Project Settings → API** (o *Data API*) copia la **Project URL** y la clave **anon public**.
4. Pon la URL y la clave en `src/lib/online/client.ts` (`DEFAULT_URL` / `DEFAULT_KEY`) o, si prefieres no tenerlas en el código, como secretos de GitHub `SUPABASE_URL` y `SUPABASE_ANON_KEY` (**Settings → Secrets and variables → Actions**).
5. Vuelve a generar el APK (sube el cambio o **Actions → Android APK → Run workflow**).

Este repositorio ya está conectado al proyecto `octhrztpcljpdopdimrj`.

La clave *anon* es pública por diseño: lo que cada uno puede hacer lo limitan las reglas de seguridad (RLS) del esquema, que permiten leer y añadir resultados pero no borrar ni modificar los de otros.

Para probar en local, crea un archivo `.env` con `EXPO_PUBLIC_SUPABASE_URL=…` y `EXPO_PUBLIC_SUPABASE_ANON_KEY=…`.

## Actualizaciones

Cada APK lleva su número de versión (el número de ejecución de GitHub Actions). En **Progreso → Actualizaciones → Buscar actualizaciones** (y con un aviso en la pantalla de inicio) la app comprueba si hay una versión más nueva en la release `apk-latest` y la descarga; se instala encima de la anterior y **no se pierde el progreso**, porque todas las versiones usan el mismo identificador y la misma firma.

Para que funcione, el APK tiene que poder descargarse sin iniciar sesión, es decir, **el repositorio debe ser público** (*Settings → General → Danger Zone → Change visibility*). Es también lo que permite que tus amigos descarguen la app sin cuenta de GitHub.

## Créditos de los datos

- Banderas: [region-flags](https://github.com/google/region-flags) (Wikimedia Commons, dominio público) y [flag-icons](https://github.com/lipis/flag-icons) (MIT). Banderas extra dibujadas para esta app.
- Países: [world-countries](https://github.com/mledoze/countries) (ODbL).
- Mapas: [Natural Earth](https://www.naturalearthdata.com/) vía [world-atlas](https://github.com/topojson/world-atlas) (dominio público).
- Población: Banco Mundial (CC BY 4.0).
