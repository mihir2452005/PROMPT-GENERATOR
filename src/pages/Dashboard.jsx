
import PromptGenerator from '../components/PromptGenerator'
import TrendSection from '../components/TrendSection'

export default function Dashboard(){
  return (
    <div style={{padding:'40px',background:'#050816',minHeight:'100vh',color:'white'}}>
      <h1>MetaPrompt Studio</h1>
      <TrendSection />
      <PromptGenerator />
    </div>
  )
}
