
import {useState} from 'react'
import api from '../services/api'

export default function PromptGenerator(){
  const [prompt,setPrompt]=useState('')

  async function generate(){
    const res = await api.post('/generate',{
      topic:'rainy anime night',
      mood:'dreamy'
    })
    setPrompt(res.data.prompt)
  }

  return (
    <div>
      <button onClick={generate}>Generate Prompt</button>
      <p>{prompt}</p>
    </div>
  )
}
