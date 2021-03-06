import React, { useState, useEffect } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import Login from './components/Login'
import Recommendations from './components/Recommendations'
import { useQuery, useMutation, useApolloClient, useSubscription } from '@apollo/client';
import { ALL_AUTHORS, ALL_BOOKS, CREATE_BOOK, UPDATE_BORN, LOGIN, FAVORITE, BOOK_ADDED } from './queries'

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState(null)
  const allAuthorsResult = useQuery(ALL_AUTHORS) 
  const allBooksResult = useQuery(ALL_BOOKS)
  const favoriteResult = useQuery(FAVORITE, {fetchPolicy: 'no-cache'})
  const client = useApolloClient()


  const [ createBook ] = useMutation(CREATE_BOOK, {
    refetchQueries: [ { query: ALL_BOOKS }, { query: ALL_AUTHORS }, { query: FAVORITE } ]
  })

  const [ updateBorn ] = useMutation(UPDATE_BORN, { 
    refetchQueries: [ { query: ALL_AUTHORS } ]
  })

  const [ login ] = useMutation(LOGIN, {
    onError: (error) => {
      console.error(error)
    },
  })

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      window.alert(`book ${subscriptionData.data.bookAdded.title} has been added`)
      const dataInStore = client.readQuery({ query: ALL_BOOKS })
      console.log(dataInStore.allBooks)
      console.log(subscriptionData)
      if (!dataInStore.allBooks.map((book) => book.id).includes(subscriptionData.data.bookAdded.id)) {
        client.writeQuery({
          query: ALL_BOOKS,
          data: { allBooks : dataInStore.allBooks.concat(subscriptionData.data.bookAdded) }
        })
      }
    }
  })

  useEffect(() => {
    const loadedToken = localStorage.getItem('library-user-token')
    if (loadedToken) {
      setToken(loadedToken)
    }
  }, [])

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {
          token !== null ?
            <>
              <button onClick={() => setPage('add')}>add book</button>
              <button onClick={() => setPage('recommend')}>recommendations</button>
              <button onClick={() => {
                setToken(null)
                localStorage.clear()
                client.resetStore()
              }}>
                logout
              </button>
            </>
            :
            <button onClick={() => setPage('login')}>login</button>
        }
      </div>

      <Authors
        show={page === 'authors'} result={allAuthorsResult} updateBorn={updateBorn} token={token}
      />
      <Books
        show={page === 'books'} result={allBooksResult}
      />
      {
        token !== null ? 
          <>
            <NewBook
              show={page === 'add'} createBook={createBook}
            />
            <Recommendations
              show={page === 'recommend'} allBooksResult={allBooksResult} favoriteResult={favoriteResult}
            />
          </>
        :
          <Login  
            show={page === 'login'} login={login} setToken={setToken} setPage={setPage}
          /> 
      }
    </div>
  )
}

export default App