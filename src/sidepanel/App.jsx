import { useState, useEffect } from "react";

function App() {
  const [data, setData] = useState(null);
  const [queryParams, setQueryParams] = useState({});
  const [requestBody, setRequestBody] = useState("");
  const [cookies, setCookies] = useState("");
  const [qParam, setQParam] = useState("");
  const [response, setResponse] = useState("");

  // Fetch stored data from background script on component mount
  useEffect(() => {
    chrome.runtime.sendMessage({ action: "getStoredData" }, (storedData) => {
      if (storedData) {
        const { queryParams, requestBody } = storedData;
        setQueryParams(queryParams);
        setRequestBody(requestBody);
        console.log(document.cookie);
        // setCookies(cookies);
      }
    });

    chrome.storage.session.get("data", (result) => {
      setData(result.data);
    });

    chrome.storage.session.onChanged.addListener((changes) => {
      const updatedData = changes["data"];
      if (!updatedData) return;
      setData(updatedData);
    });
  }, []);

  const handleInputChange = (e) => setQParam(e.target.value);

  const handleFetchRequest = async () => {
    const updatedQueryParams = { ...queryParams, q: qParam };
    const searchParams = new URLSearchParams(updatedQueryParams).toString();

    try {
      const results = await fetch(
        `https://www.facebook.com/ads/library/async/search_ads/?${searchParams}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookies,
          },
          body: requestBody,
        }
      );
      const json = await results.json();
      setResponse(JSON.stringify(json, null, 2));
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    }
  };

  return (
    <div className="font-sans w-full h-full p-4">
      <p>Selection</p>
      <h1>{JSON.stringify(data, null, 4)}</h1>
      <label htmlFor="q-param">Enter new q parameter value:</label>
      <input
        type="text"
        id="q-param"
        value={qParam}
        onChange={handleInputChange}
      />
      <button onClick={handleFetchRequest}>Fetch Ad</button>
      <pre id="response">{response}</pre>
    </div>
  );
}

export default App;
