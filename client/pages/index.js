export default function Home() {
  return <h1>{process.env.SQ_SITE_NAME}</h1>
}

export const getServerSideProps = () => {
  console.log(process.env)
  return { props: {} }
}
