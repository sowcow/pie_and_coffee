import _ from 'lodash'
import { useWindowSize } from './hooks'

import { useState } from 'react'
import { useEffect } from 'react'
import { useRef } from 'react'
import { useCallback } from 'react'

import { useSwipeable } from 'react-swipeable'

const BASE_URL = '/pie_and_coffee'
const PEN_PALETTE = [ // subset of IBM colorblind palette
  'placeholder', 
  '#648FFF', // two blues
  '#785EF0',
  '#FFB000', // two oranges
  '#FE6100',
  '#000000', // final color
]

// firefox and chrome incompatibility lives here
let isHand = touchEvent =>
  touchEvent.force === 1 && touchEvent.rotationAngle === 0

let decks = [
  {
    id: '3line',
    name: 'Three Linear',
  },
  {
    id: '5line',
    name: 'Five Linear',
  },
  {
    id: '7line',
    name: 'Seven Linear',
  },
  {
    id: '5quadratic',
    name: 'Five Quadratic',
  },
  {
    id: '7quadratic',
    name: 'Seven Quadratic',
  },
  {
    id: '5cubic',
    name: 'Five Cubic',
  },
  {
    id: '7cubic',
    name: 'Seven Cubic',
  },
]
let groupsData = []
decks.forEach(x => {
  groupsData[x.id] = x
})

let filesFor = name => {
  let files = _.times(100, i => `${BASE_URL}/${name}/${i+1}.png`)
  return _.shuffle(files)
}

function Img({ psize, px, py, file }) {
  let w = useWindowSize()

  let wsize = Math.min(w.width, w.height)
  let size = wsize * psize / 100
  let x = (w.width - size) * px / 100
  let y = (w.height - size) * py / 100

  if (!size) size = 0

  return <img src={file} width={size} height={size} style={{
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
  }} />
}

function Form({ fpsize, fpx, fpy, lines, setLines, move, currentIteration }) {
  let w = useWindowSize()

  let wsize = Math.min(w.width, w.height)
  let size = wsize * fpsize / 100
  let x = (w.width - size) * fpx / 100
  let y = (w.height - size) * fpy / 100

  let ref = useRef()

  let addPoint = x => {
    let line = lines[lines.length - 1]
    line.points.push(x) // so what
    setLines(lines.slice(0, lines.length - 1).concat({ ...line }))
  }
  let _line = lines[lines.length - 1]
  let points = _line && _line.points || []

  let started = e => {
    let touches = e.changedTouches

    Array.from(touches).forEach(t => {
      if (isHand(t)) return
      let x = t.clientX
      let y = t.clientY
      setLines(lines.concat([{ points: [{ x, y }], color: PEN_PALETTE[currentIteration] }]))
    })
  }

  let moved = e => {
    let touches = e.changedTouches
    Array.from(touches).forEach(t => {
      if (isHand(t)) return
      let x = t.clientX
      let y = t.clientY
      addPoint({x, y})
    })
  }

  useEffect(() => {
    let canvas = ref.current
    if (!canvas) return
    let ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    let r = size/2
    ctx.arc(x+r, y+r, r, 0, 2 * Math.PI)
    ctx.strokeStyle = 'gray'
    ctx.lineWidth = 0.5
		ctx.stroke()
    ctx.closePath()

    lines.forEach(({points, color}) => {
      ctx.beginPath()
      ctx.lineWidth = 2
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.strokeStyle = color
      ctx.shadowColor = 'white'
      ctx.shadowBlur = 3
      ctx.stroke()
      ctx.closePath()
    })
  }, [ref.current, lines.length, points.length])

  return <canvas width={w.width} height={w.height} style={{
    position: 'fixed',
  }} ref={ref}
  onTouchStart={started}
  onTouchMove={moved}
  >
  </canvas>
}

let Menu = ({ goDeck, iterations, setIterations }) => {
  let items = decks
  return <div style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: '300%',
        paddingTop: 15,
        paddingBottom: 15,
    }}>
      Iterations:
      <input type='number'
        min={1}
        max={5}
        value={iterations}
        onChange={e => setIterations(parseInt(e.target.value))}
        style={{
          display: 'inline',
          width: 30,
          marginLeft: 4,
          transform: 'translateY(-5px)',
        }}
      />
    </div>
    { items.map(x =>
      <div
        key={x.id}
        onClick={() => goDeck(x.id)}
        style={{
          fontFamily: 'monospace',
          fontSize: '300%',
          paddingTop: 15,
          paddingBottom: 15,
      }}>
        {x.name}
      </div>
    )}
  </div>
}

const STEP = {
  SEE: 0,
  DRAW: 1,
  COMPARE: 2,
  MENU: 3,
}

const MIN_SCALE = 20
const MAX_SCALE = 100

let prevStep = null

function App() {
  let [psize, setPsize] = useState(_.random(MIN_SCALE, MAX_SCALE)) // duplicated stuff
  let [px, setPx] = useState(_.random(100))
  let [py, setPy] = useState(_.random(100))
  let imgParams = { psize, px, py }

  let [fpsize, setFPsize] = useState(_.random(MIN_SCALE, MAX_SCALE)) // duplicated stuff
  let [fpx, setFPx] = useState(_.random(100))
  let [fpy, setFPy] = useState(_.random(100))
  let [lines, setLines] = useState([])
  let clearLines = () => setLines([])

  let randomizePositions = () => {
    setPsize(_.random(MIN_SCALE, MAX_SCALE)) // duplicated stuff
    setPx(_.random(100))
    setPy(_.random(100))

    setFPsize(_.random(MIN_SCALE, MAX_SCALE))
    setFPx(_.random(100))
    setFPy(_.random(100))
  }

  let [step, setStep] = useState(STEP.MENU)

  let [fileIndex, setFileIndex] = useState(0)
  let nextFile = () => setFileIndex(fileIndex + 1)

  let [iterations, setIterations] = useState(1)
  let [currentIteration, setCurrentIteration] = useState(1)
  let finalIteration = currentIteration === iterations
  let nextIteration = () => setCurrentIteration(currentIteration + 1)
  let doneIterating = () => setCurrentIteration(1)

  let [currentFiles, setCurrentFiles] = useState([])

  let [deck, setDeck] = useState(decks[0])
  let goDeck = name => {
    clearLines()
    setFileIndex(0)
    setDeck(name)
    setStep(STEP.SEE)
    setCurrentFiles(filesFor(name))
  }
  
  let file = currentFiles[fileIndex] // 'noop'

  let move = () => {
    if (step === STEP.SEE) {
      setStep(STEP.DRAW)
    } else if (step === STEP.DRAW) {
      if (finalIteration) {
        doneIterating()
        setStep(STEP.COMPARE)
      } else {
        nextIteration()
        setStep(STEP.SEE)
      }
    } else if (step === STEP.COMPARE) {
      nextFile()
      randomizePositions()
      clearLines()
      setStep(STEP.SEE)
    }
  }
  let formParams = { fpsize, fpx, fpy, lines, setLines, move, currentIteration }

  let moveAction = e => {
    let touches = e.event.changedTouches
    let t = touches[0] || {}
    if (!isHand(t)) return
    move()
  }

  let menuAction = e => {
    let touches = e.event.changedTouches
    let t = touches[0] || {}
    if (!isHand(t)) return
    clearLines()
    prevStep = step
    if (step === STEP.MENU) setStep(prevStep)
    else setStep(STEP.MENU)
  }

  let { ref } = useSwipeable({
    onSwipedLeft: moveAction,
    onSwipedRight: moveAction,
    onSwipedDown: moveAction,
    onSwipedUp: menuAction,
  })

  useEffect(() => {
    ref(document)
  }, [])

  return <div>
    { step === STEP.SEE && <Img {...imgParams} file={file} /> }
    { step === STEP.DRAW && <Form {...formParams} /> }
    { step === STEP.COMPARE &&
      <>
        <Img px={fpx} py={fpy} psize={fpsize} file={file} />
        <Form {...formParams} />
      </>
    }
    { step === STEP.MENU &&
      <Menu goDeck={goDeck} iterations={iterations} setIterations={setIterations} />
    }
  </div>
}

export default App
