import { useRouteError } from "react-router-dom";

class CustomError extends Error {
  statusText = "";

  constructor(message: string) {
    super(message);
    // 👇️ because we are extending a built-in class
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

const NotFoundPage = () => {
  const error = useRouteError();
  console.log(error);

  return (
    <>
      <h1>Oops!</h1>
      <h3>Sorry, an unexpected error has occurred</h3>
      <p>
        {error instanceof CustomError && (error.message || error.statusText)}{" "}
      </p>
    </>
  );
};

export default NotFoundPage;
