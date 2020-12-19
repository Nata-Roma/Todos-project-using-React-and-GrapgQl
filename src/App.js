import React, { useState } from 'react';
import { useQuery, useMutation, gql } from "@apollo/client";

const GET_TODOS = gql`
  query getTodos {
    todos {
      done
      id
      text
    }
  }
`;

const TOGGLE_TODO = gql`
  mutation toggleTodo($id: uuid!, $done: Boolean!) {
    update_todos(where: {id: {_eq: $id}}, _set: {done: $done}) {
      returning {
        done
        id
        text
      }
    }
}
`;

const ADD_TODO = gql`
  mutation addTodo ($text: String!) {
    insert_todos(objects: {text: $text}) {
      returning {
        id
        text
        done
      }
    }
  }
`;

const DELETE_TODO = gql`
  mutation deleteTodo($id: uuid!) {
    delete_todos(where: {id: {_eq: $id}}) {
      returning {
        done
        id
        text
      }
    }
  }
`;

function App() {
  const [textTodo, setTextTodo] = useState('');
  const { data, loading, error } = useQuery(GET_TODOS);
  const [toggleTodo] = useMutation(TOGGLE_TODO);
  const [addTodo] = useMutation(ADD_TODO, { onCompleted: () => setTextTodo('') });
  const [deleteTodo] = useMutation(DELETE_TODO);

  const toggleTodoHandler = async ({ id, done }) => {
    const toggle_data = await toggleTodo({ variables: { id: id, done: !done } });
    console.log(toggle_data);

  }

  const addTodoHandler = (e) => {
    e.preventDefault();
    if (!textTodo.trim()) {
      setTextTodo('');
      return;
    }
    addTodo({
      variables: { text: textTodo },
      refetchQueries: [{ query: GET_TODOS }]
    });
  }

  const deleteTodoHandler = ({ id }) => {
    const isConfirmed = window.confirm('Do you want to delete this todo?');
    if (isConfirmed) {
      deleteTodo({
        variables: { id },
        update: (cache) => {
          const prevData = cache.readQuery({ query: GET_TODOS });
          const newData = prevData.todos.filter((todo) => todo.id !== id);
          cache.writeQuery({ query: GET_TODOS, data: { todos: newData } });
        }
      });
    }

  }

  if (loading) return <div>Loading...</div>

  if (error) return <div>Error fetching todos!</div>

  return (
    <div className="vh-100 code flex flex-column items-center bg-purple white pa3 fl-1">
      <h1 className="f2-l">GraphQl Checklist</h1>
      <form className="mb3" onSubmit={addTodoHandler}>
        <input className="pa2 f4" type="text"
          placeholder="New todo..."
          onChange={(e) => setTextTodo(e.target.value)}
          value={textTodo}
        />
        <button className="pa2 f4 bg-green white pointer" type="submit">Confirm</button>
      </form>
      <h2 className="underline f2">Todo List</h2>
      <div className="flex items-center justify-center flex-column f3">
        {data.todos.map((todo) => (
          <p style={{ userSelect: "none" }} key={todo.id} onDoubleClick={() => toggleTodoHandler(todo)}>
            <span className={`pointer list pa1 ${todo.done && ' strike'}`}>
              {todo.text}
            </span>
            <button className="bg-transparent bn f3 red" onClick={() => deleteTodoHandler(todo)}>&times;</button>
          </p>
        )

        )}
      </div>


    </div>
  );
}

export default App;
