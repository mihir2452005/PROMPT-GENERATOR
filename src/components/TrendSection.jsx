
export default function TrendSection(){
  const trends=['Rainy Nights','Lo-fi Rooms','Dreamcore']

  return (
    <div>
      <h2>Trending</h2>
      {trends.map(t=><div key={t}>{t}</div>)}
    </div>
  )
}
