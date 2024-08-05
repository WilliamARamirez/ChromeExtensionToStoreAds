import { FormControl, FormLabel, Input, Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";

function App() {
  const [queryParams, setQueryParams] = useState({});
  const [formDataObject, setFormDataObject] = useState("");
  const [cookiesArr, setCookiesArr] = useState([]);
  const [value, setValue] = useState("");
  const [response, setResponse] = useState("");
  const [url, setUrl] = useState("");
  const handleChange = (event) => setValue(event.target.value);
  const [isReadyToFetch, setIsReadyToFetch] = useState(false);

  useEffect(() => {
    document.addEventListener("DOMContentLoaded", function () {
      // Listen for messages from content.js
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "updatePanel") {
          getStoredData();
        }
      });
    });
  }, []);

  const getStoredData = async () => {
    const storedData = await chrome.storage.local.get([
      "queryParams",
      "formData",
      "cookies",
    ]);
    if (storedData) {
      const { queryParams, formData, cookies } = storedData;
      setQueryParams(JSON.parse(queryParams ?? "{}"));
      setFormDataObject(JSON.parse(formData ?? "{}"));
      setCookiesArr(JSON.parse(cookies ?? "[]"));
    }
  };

  const convertObjToFormData = (obj) => {
    const formData = new FormData();
    Object.keys(obj).forEach((key) => {
      formData.append(key, obj[key]);
    });
    return formData;
  };

  const handleFetchRequest = async () => {
    const updatedQueryParams = { ...queryParams, q: value };
    const searchParams = new URLSearchParams(updatedQueryParams).toString();
    const url = `https://www.facebook.com/ads/library/async/search_ads/?${searchParams}`;
    const formData = convertObjToFormData(formDataObject);
    const cookies = cookiesArr.reduce((acc, cookie) => {
      acc[cookie.name] = cookie.value;
      return acc;
    }, {});

    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");

    setUrl(url);
    try {
      const results = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieString,
        },
        body: formData,
      });
      const contentType = results.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await results.json();
        setResponse(JSON.stringify(json, null, 2));
      } else {
        const text = await results.text();
        setResponse(text);
      }
    } catch (error) {
      console.log(error);
      setResponse(JSON.stringify(error, null, 2));
    }
  };

  useEffect(() => {
    const hasFormData = Object.keys(formDataObject).length > 0;
    const hasCookies = cookiesArr.length > 0;
    const hasQueryParams = Object.keys(queryParams).length > 0;
    setIsReadyToFetch(hasFormData && hasCookies && hasQueryParams);
  }, [formDataObject, cookiesArr, queryParams]);

  return (
    <div className="font-sans w-full h-full p-4">
      <FormControl className="gap-4 flex flex-col">
        <div className={`${isReadyToFetch ? "hidden" : ""}`}>
          {` Please refresh facebook ads library: ${isReadyToFetch} `}
        </div>
        <FormLabel mb="8px">Search To Copy:</FormLabel>
        <Input
          value={value}
          onChange={handleChange}
          placeholder="enter search query"
          size={"lg"}
        />
        <Button
          onClick={handleFetchRequest}
          colorScheme="teal"
          isDisabled={!isReadyToFetch}
        >
          Search
        </Button>
      </FormControl>

      <div className="mt-8">
        <pre>{JSON.stringify(formDataObject, null, 2)}</pre>
        <pre>{JSON.stringify(cookiesArr, null, 2)}</pre>
        <pre>{JSON.stringify(queryParams, null, 2)}</pre>
        <pre>{JSON.stringify(response, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;
