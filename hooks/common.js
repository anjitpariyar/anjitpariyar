import { useEffect, useState } from "react";
import { supabase } from "utils/supabaseClient";

const useSupabaseData = (tableName) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from(tableName).select("*");
        if (error) throw error;
        setData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tableName]);

  return { data, isLoading, isError };
};

export default useSupabaseData;
