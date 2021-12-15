import getConfig from 'next/config'

export default function Home() {
  const {
    publicRuntimeConfig: { SQ_SITE_NAME },
  } = getConfig()
  return <h1>{SQ_SITE_NAME}</h1>
}

export const getServerSideProps = () => {
  const {
    serverRuntimeConfig: { mysecret },
  } = getConfig()
  console.log(mysecret)
  return { props: {} }
}
