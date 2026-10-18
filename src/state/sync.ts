/**
 * Keeps the app's community data in step with the database. Called when a
 * member signs in and each time they open Today, so new Stories show up
 * without any endless feed or background polling.
 */
import { useEffect } from "react";
import { live, loadCommunity } from "../lib/community";
import { useJourney } from "./journey";

let inFlight = false;

export function useCommunityRefresh(when = true) {
  const { state, set, say } = useJourney();
  useEffect(() => {
    if (!when || state.session !== "member" || !live() || inFlight) return;
    inFlight = true;
    loadCommunity(state)
      .then(fresh => set(s => ({ ...s, ...fresh, todayIds: null })))
      .catch(e => { if (e?.status === 401) return; say("We couldn't load the latest Stories. Check your connection."); })
      .finally(() => { inFlight = false; });
  }, [when, state.session]); // eslint-disable-line react-hooks/exhaustive-deps
}
