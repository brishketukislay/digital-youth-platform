// import {
//   useEffect,
//   useState,
// } from "react";

// import Layout from "../../components/Layout";

// import {
//   adminOverview,
//   adminPlayers,
//   getProgramme,
//   updateProgramme,

//   getThemes,
//   createTheme,
//   activateTheme,

//   getMaps,
//   createMap,
//   activateMap,

//   getPhases,
//   createPhase,

//   getPointRules,
//   updatePointRule,

//   getRewards,
//   createReward,

//   startAttendance,
//   awardXP,
// } from "../../api/client";


// const defaultTheme = {
//   name: "Forest",

//   primary: "#18775B",
//   secondary: "#0F513C",
//   accent: "#43B98B",

//   background: "#F3F7F5",
//   surface: "#FFFFFF",
//   text: "#17221E",
// };


// export default function AdminDashboard() {

//   const [overview, setOverview] =
//     useState<any>(null);

//   const [players, setPlayers] =
//     useState<any[]>([]);

//   const [programme, setProgramme] =
//     useState<any>(null);

//   const [themes, setThemes] =
//     useState<any[]>([]);

//   const [maps, setMaps] =
//     useState<any[]>([]);

//   const [phases, setPhases] =
//     useState<any[]>([]);

//   const [rules, setRules] =
//     useState<any[]>([]);

//   const [rewards, setRewards] =
//     useState<any[]>([]);

//   const [attendance, setAttendance] =
//     useState<any>(null);

//   const [message, setMessage] =
//     useState("");


//   async function load() {

//     try {

//       const [
//         overviewResponse,
//         playersResponse,
//         programmeResponse,
//         themesResponse,
//         mapsResponse,
//         phasesResponse,
//         rulesResponse,
//         rewardsResponse,
//       ] = await Promise.all([

//         adminOverview(),
//         adminPlayers(),

//         getProgramme(),

//         getThemes(),
//         getMaps(),

//         getPhases(),
//         getPointRules(),
//         getRewards(),

//       ]);


//       setOverview(
//         overviewResponse.data
//       );

//       setPlayers(
//         playersResponse.data
//       );

//       setProgramme(
//         programmeResponse.data
//       );

//       setThemes(
//         themesResponse.data
//       );

//       setMaps(
//         mapsResponse.data
//       );

//       setPhases(
//         phasesResponse.data
//       );

//       setRules(
//         rulesResponse.data
//       );

//       setRewards(
//         rewardsResponse.data
//       );

//     } catch (error: any) {

//       setMessage(
//         error?.response?.data?.detail ||
//         "Unable to load administration data."
//       );

//     }

//   }


//   useEffect(() => {

//     load();

//   }, []);


//   async function saveProgramme() {

//     if (!programme) {
//       return;
//     }

//     await updateProgramme({

//       name:
//         programme.name,

//       description:
//         programme.description,

//       start_date:
//         programme.start_date,

//       end_date:
//         programme.end_date,

//       target_xp:
//         Number(
//           programme.target_xp
//         ),

//     });

//     setMessage(
//       "Programme settings saved."
//     );

//     await load();

//   }


//   async function addForestTheme() {

//     await createTheme(
//       defaultTheme
//     );

//     setMessage(
//       "Theme created."
//     );

//     await load();

//   }


//   async function useTheme(
//     id: number
//   ) {

//     await activateTheme(
//       id
//     );

//     setMessage(
//       "Theme activated."
//     );

//     await load();

//   }


//   async function addMap() {

//     const name =
//       window.prompt(
//         "Map name",
//         "Cumbernauld"
//       );

//     if (!name) {
//       return;
//     }

//     const image =
//       window.prompt(
//         "Map image URL",
//         ""
//       );

//     await createMap({

//       name,

//       description:
//         "Programme map",

//       background_image:
//         image || null,

//     });

//     setMessage(
//       "Map created."
//     );

//     await load();

//   }


//   async function useMap(
//     id: number
//   ) {

//     await activateMap(
//       id
//     );

//     setMessage(
//       "Map activated."
//     );

//     await load();

//   }


//   async function addPhase() {

//     const name =
//       window.prompt(
//         "Phase name",
//         "Art"
//       );

//     if (!name) {
//       return;
//     }

//     const description =
//       window.prompt(
//         "Phase description",
//         ""
//       );


//     await createPhase({

//       name,

//       description,

//       colour:
//         "#18775B",

//       icon:
//         "star",

//     });


//     setMessage(
//       "Phase created."
//     );

//     await load();

//   }


//   async function editRule(
//     rule: any
//   ) {

//     const individual =
//       window.prompt(
//         `${rule.name} – individual XP`,
//         String(
//           rule.individual_xp
//         )
//       );

//     if (
//       individual === null
//     ) {
//       return;
//     }


//     const group =
//       window.prompt(
//         `${rule.name} – group XP`,
//         String(
//           rule.group_xp
//         )
//       );

//     if (
//       group === null
//     ) {
//       return;
//     }


//     await updatePointRule(
//       rule.id,
//       {

//         name:
//           rule.name,

//         code:
//           rule.code,

//         individual_xp:
//           Number(
//             individual
//           ),

//         group_xp:
//           Number(
//             group
//           ),

//         enabled:
//           rule.enabled,

//       }
//     );


//     setMessage(
//       "XP rule updated."
//     );

//     await load();

//   }


//   async function addReward() {

//     const name =
//       window.prompt(
//         "Reward name",
//         "Mystery Reward"
//       );

//     if (!name) {
//       return;
//     }


//     const xp =
//       window.prompt(
//         "Lifetime XP threshold",
//         "15000"
//       );


//     await createReward({

//       name,

//       description:
//         "Programme reward",

//       xp_threshold:
//         Number(xp),

//       reward_type:
//         "individual",

//       value:
//         0,

//       active:
//         true,

//     });


//     setMessage(
//       "Reward created."
//     );

//     await load();

//   }


//   async function createAttendance() {

//     const response =
//       await startAttendance();

//     setAttendance(
//       response.data
//     );

//   }


//   async function giveXP(
//     player: any
//   ) {

//     const amount =
//       window.prompt(
//         `XP for ${player.gamertag}`,
//         "500"
//       );

//     if (!amount) {
//       return;
//     }


//     const reason =
//       window.prompt(
//         "Reason",
//         "Positive contribution"
//       );


//     await awardXP({

//       player_id:
//         player.id,

//       amount:
//         Number(amount),

//       reason:
//         reason ||
//         "Manual award",

//     });


//     setMessage(
//       "XP awarded."
//     );

//     await load();

//   }


//   if (!overview) {

//     return (

//       <Layout title="Administration">

//         <div className="container">
//           Loading administration...
//         </div>

//       </Layout>

//     );

//   }


//   return (

//     <Layout title="Programme Administration">

//       <div className="admin-header">

//         <div>

//           <h1>
//             Programme Control Centre
//           </h1>

//           <p className="muted">
//             Everything that changes between
//             programmes can be configured here.
//           </p>

//         </div>

//         {message && (

//           <div className="success-message">
//             {message}
//           </div>

//         )}

//       </div>


//       {/* ====================================================
//           OVERVIEW
//       ==================================================== */}

//       <div className="grid admin-stats">

//         <div className="card">

//           <div className="stat-label">
//             PLAYERS
//           </div>

//           <div className="xp">
//             {overview.players}
//           </div>

//         </div>


//         <div className="card">

//           <div className="stat-label">
//             GROUP XP
//           </div>

//           <div className="xp">
//             {overview.group_xp.toLocaleString()}
//           </div>

//         </div>


//         <div className="card">

//           <div className="stat-label">
//             TARGET
//           </div>

//           <div className="xp">
//             {overview.target_xp.toLocaleString()}
//           </div>

//         </div>

//       </div>


//       {/* ====================================================
//           PROGRAMME
//       ==================================================== */}

//       {programme && (

//         <section className="card admin-section">

//           <div className="section-title">

//             <div>

//               <h2>
//                 Programme
//               </h2>

//               <p className="muted">
//                 Name, dates and collective target.
//               </p>

//             </div>

//             <button
//               className="btn"
//               onClick={
//                 saveProgramme
//               }
//             >
//               Save
//             </button>

//           </div>


//           <label>
//             Programme name

//             <input
//               value={
//                 programme.name
//               }
//               onChange={
//                 e =>
//                   setProgramme({
//                     ...programme,
//                     name:
//                       e.target.value,
//                   })
//               }
//             />

//           </label>


//           <label>
//             Description

//             <textarea
//               value={
//                 programme.description ||
//                 ""
//               }
//               onChange={
//                 e =>
//                   setProgramme({
//                     ...programme,
//                     description:
//                       e.target.value,
//                   })
//               }
//             />

//           </label>


//           <label>
//             Group jackpot target XP

//             <input
//               type="number"
//               value={
//                 programme.target_xp
//               }
//               onChange={
//                 e =>
//                   setProgramme({
//                     ...programme,
//                     target_xp:
//                       Number(
//                         e.target.value
//                       ),
//                   })
//               }
//             />

//           </label>

//         </section>

//       )}


//       {/* ====================================================
//           THEMES
//       ==================================================== */}

//       <section className="card admin-section">

//         <div className="section-title">

//           <div>

//             <h2>
//               App Theme
//             </h2>

//             <p className="muted">
//               Change the colours of the entire
//               platform without changing code.
//             </p>

//           </div>

//           <button
//             className="btn secondary"
//             onClick={
//               addForestTheme
//             }
//           >
//             Add Theme
//           </button>

//         </div>


//         <div className="theme-grid">

//           {themes.map(theme => (

//             <div
//               key={theme.id}
//               className="theme-card"
//               style={{
//                 background:
//                   theme.background,
//                 color:
//                   theme.text,
//               }}
//             >

//               <div
//                 className="theme-preview"
//                 style={{
//                   background:
//                     theme.primary,
//                 }}
//               >
//                 {theme.name}
//               </div>


//               <div className="theme-swatches">

//                 <span
//                   style={{
//                     background:
//                       theme.primary,
//                   }}
//                 />

//                 <span
//                   style={{
//                     background:
//                       theme.secondary,
//                   }}
//                 />

//                 <span
//                   style={{
//                     background:
//                       theme.accent,
//                   }}
//                 />

//               </div>


//               <button
//                 className="btn"
//                 onClick={() =>
//                   useTheme(
//                     theme.id
//                   )
//                 }
//               >
//                 Use Theme
//               </button>

//             </div>

//           ))}

//         </div>

//       </section>


//       {/* ====================================================
//           MAP
//       ==================================================== */}

//       <section className="card admin-section">

//         <div className="section-title">

//           <div>

//             <h2>
//               Maps
//             </h2>

//             <p className="muted">
//               Replace Cumbernauld with another
//               programme map whenever required.
//             </p>

//           </div>

//           <button
//             className="btn"
//             onClick={
//               addMap
//             }
//           >
//             Add Map
//           </button>

//         </div>


//         <div className="admin-list">

//           {maps.map(map => (

//             <div
//               className="admin-row"
//               key={map.id}
//             >

//               <div>

//                 <strong>
//                   {map.name}
//                 </strong>

//                 <div className="muted">
//                   {map.description}
//                 </div>

//               </div>


//               <button
//                 className="btn secondary"
//                 onClick={() =>
//                   useMap(
//                     map.id
//                   )
//                 }
//               >
//                 Use This Map
//               </button>

//             </div>

//           ))}

//         </div>

//       </section>


//       {/* ====================================================
//           PHASES
//       ==================================================== */}

//       <section className="card admin-section">

//         <div className="section-title">

//           <div>

//             <h2>
//               Phases
//             </h2>

//             <p className="muted">
//               Programme themes and activities.
//             </p>

//           </div>

//           <button
//             className="btn"
//             onClick={
//               addPhase
//             }
//           >
//             Add Phase
//           </button>

//         </div>


//         <div className="admin-list">

//           {phases.map(
//             phase => (

//               <div
//                 className="admin-row"
//                 key={phase.id}
//               >

//                 <div>

//                   <strong>
//                     {phase.icon}{" "}
//                     {phase.name}
//                   </strong>

//                   <div className="muted">
//                     {
//                       phase.description
//                     }
//                   </div>

//                 </div>

//                 <div
//                   className="colour-dot"
//                   style={{
//                     background:
//                       phase.colour,
//                   }}
//                 />

//               </div>

//             )
//           )}

//         </div>

//       </section>


//       {/* ====================================================
//           XP RULES
//       ==================================================== */}

//       <section className="card admin-section">

//         <div className="section-title">

//           <div>

//             <h2>
//               XP Rules
//             </h2>

//             <p className="muted">
//               Control how much XP different
//               activities generate.
//             </p>

//           </div>

//         </div>


//         <div className="admin-list">

//           {rules.map(
//             rule => (

//               <div
//                 className="admin-row"
//                 key={rule.id}
//               >

//                 <div>

//                   <strong>
//                     {rule.name}
//                   </strong>

//                   <div className="muted">
//                     {rule.code}
//                   </div>

//                 </div>


//                 <div className="rule-values">

//                   <span>
//                     Individual:
//                     {" "}
//                     {rule.individual_xp}
//                   </span>

//                   <span>
//                     Group:
//                     {" "}
//                     {rule.group_xp}
//                   </span>

//                   <button
//                     className="btn secondary"
//                     onClick={() =>
//                       editRule(
//                         rule
//                       )
//                     }
//                   >
//                     Edit
//                   </button>

//                 </div>

//               </div>

//             )
//           )}

//         </div>

//       </section>


//       {/* ====================================================
//           REWARDS
//       ==================================================== */}

//       <section className="card admin-section">

//         <div className="section-title">

//           <div>

//             <h2>
//               Rewards
//             </h2>

//             <p className="muted">
//               Configure individual reward thresholds.
//             </p>

//           </div>

//           <button
//             className="btn"
//             onClick={
//               addReward
//             }
//           >
//             Add Reward
//           </button>

//         </div>


//         <div className="admin-list">

//           {rewards.map(
//             reward => (

//               <div
//                 className="admin-row"
//                 key={reward.id}
//               >

//                 <div>

//                   <strong>
//                     {reward.name}
//                   </strong>

//                   <div className="muted">
//                     {
//                       reward.description
//                     }
//                   </div>

//                 </div>

//                 <strong>
//                   {
//                     reward.xp_threshold?.toLocaleString()
//                   }{" "}
//                   XP
//                 </strong>

//               </div>

//             )
//           )}

//         </div>

//       </section>


//       {/* ====================================================
//           ATTENDANCE
//       ==================================================== */}

//       <section className="card admin-section">

//         <div className="section-title">

//           <div>

//             <h2>
//               Session Check-in
//             </h2>

//             <p className="muted">
//               Display a temporary code for players.
//             </p>

//           </div>

//           <button
//             className="btn"
//             onClick={
//               createAttendance
//             }
//           >
//             Start Session
//           </button>

//         </div>


//         {attendance && (

//           <div className="attendance-code">

//             {attendance.code}

//             <small>
//               Code expires in approximately
//               10 minutes.
//             </small>

//           </div>

//         )}

//       </section>


//       {/* ====================================================
//           PLAYERS
//       ==================================================== */}

//       <section className="card admin-section">

//         <div className="section-title">

//           <div>

//             <h2>
//               Players
//             </h2>

//             <p className="muted">
//               Staff-only management view.
//             </p>

//           </div>

//         </div>


//         <div className="admin-list">

//           {players.map(
//             player => (

//               <div
//                 className="admin-row"
//                 key={player.id}
//               >

//                 <div
//                   className="player-avatar"
//                 >
//                   {player.avatar}
//                 </div>


//                 <div
//                   style={{
//                     flex: 1,
//                   }}
//                 >

//                   <strong>
//                     {player.gamertag}
//                   </strong>

//                   <div className="muted">
//                     {
//                       player.xp.toLocaleString()
//                     }{" "}
//                     XP
//                   </div>

//                 </div>


//                 <button
//                   className="btn secondary"
//                   onClick={() =>
//                     giveXP(
//                       player
//                     )
//                   }
//                 >
//                   Award XP
//                 </button>

//               </div>

//             )
//           )}

//         </div>

//       </section>

//     </Layout>

//   );
// }
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  adminOverview,
  adminPlayers,
  startAttendance,
  awardXP,
  adminCommunityAwards,
  reviewCommunityAward,
} from "../../api/client";

type Player = {
  id: number;
  gamertag: string;
  avatar: string;
  xp: number;
};

type CommunityAward = {
  id: number;
  player_id?: number;
  category: string;
  description: string;
  submitted_by_name: string;
  submitted_by_contact: string;
  status: string;
  xp: number;
  created_at: string;
};

const avatars: Record<string, string> = {
  "avatar-1": "🦊",
  "avatar-2": "🐼",
  "avatar-3": "🐸",
  "avatar-4": "🐯",
  "avatar-5": "🐺",
  "avatar-6": "🤖",
  "avatar-7": "👾",
  "avatar-8": "🐙",
  "avatar-9": "🦉",
  "avatar-10": "🐻",
};

export default function AdminDashboard() {
  const [overview, setOverview] =
    useState<any>();

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [awards, setAwards] =
    useState<CommunityAward[]>([]);

  const [attendance, setAttendance] =
    useState<any>();

  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

  const [xpAmount, setXpAmount] =
    useState("500");

  const [xpReason, setXpReason] =
    useState("Positive participation");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  async function load() {
    try {
      setLoading(true);

      const [
        overviewResponse,
        playersResponse,
        awardsResponse,
      ] = await Promise.all([
        adminOverview(),
        adminPlayers(),
        adminCommunityAwards().catch(
          () => ({ data: [] })
        ),
      ]);

      setOverview(
        overviewResponse.data
      );

      setPlayers(
        playersResponse.data
      );

      setAwards(
        awardsResponse.data || []
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to load administration data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createAttendance() {
    try {
      const response =
        await startAttendance();

      setAttendance(response.data);
      setMessage(
        "New attendance session started."
      );
    } catch (error: any) {
      setMessage(
        error?.response?.data?.detail ||
          "Unable to start attendance."
      );
    }
  }

  async function giveXP() {
    if (!selectedPlayer) return;

    const amount =
      Number(xpAmount);

    if (
      !Number.isFinite(amount) ||
      amount === 0
    ) {
      setMessage(
        "Enter a valid XP amount."
      );
      return;
    }

    try {
      await awardXP(
        selectedPlayer.id,
        amount,
        xpReason
      );

      setMessage(
        `${amount > 0 ? "+" : ""}${amount} XP recorded for ${selectedPlayer.gamertag}.`
      );

      setSelectedPlayer(null);

      await load();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.detail ||
          "Unable to award XP."
      );
    }
  }

  async function reviewAward(
    award: CommunityAward,
    status: "approved" | "rejected"
  ) {
    try {
      await reviewCommunityAward(
        award.id,
        status
      );

      setMessage(
        status === "approved"
          ? "Community award approved."
          : "Community award rejected."
      );

      await load();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.detail ||
          "Unable to review award."
      );
    }
  }

  if (loading) {
    return (
      <Layout title="Administration">
        <div className="card">
          <h2>Loading administration...</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Administration">
      <section className="hero">
        <div className="eyebrow hero-eyebrow">
          ADMIN CONTROL CENTRE
        </div>

        <h1>
          Programme Control Centre
        </h1>

        <p>
          Operate the programme, manage participants
          and approve positive activity.
        </p>
      </section>

      {message && (
        <div className="notice">
          {message}
        </div>
      )}

      {/* OVERVIEW */}
      <div className="stats-grid">
        <div className="stat-card">
          <span>Players</span>
          <strong>
            {overview?.players || 0}
          </strong>
        </div>

        <div className="stat-card">
          <span>Group XP</span>
          <strong>
            {(
              overview?.group_xp || 0
            ).toLocaleString()}
          </strong>
        </div>

        <div className="stat-card">
          <span>Programme</span>
          <strong className="stat-text">
            {overview?.programme ||
              "Not configured"}
          </strong>
        </div>

        <div className="stat-card">
          <span>Pending awards</span>
          <strong>
            {
              awards.filter(
                award =>
                  award.status ===
                  "pending"
              ).length
            }
          </strong>
        </div>
      </div>

      <div className="admin-grid">
        {/* ATTENDANCE */}
        <section className="card">
          <div className="card-title-row">
            <div>
              <div className="eyebrow">
                SESSION
              </div>
              <h2>Attendance</h2>
            </div>

            <span className="admin-icon">
              👥
            </span>
          </div>

          <p className="muted">
            Generate a short-lived code for the
            current youth work session.
          </p>

          <button
            className="btn"
            onClick={createAttendance}
          >
            Start Session
          </button>

          {attendance && (
            <div className="attendance-display">
              <span>
                Ask players to enter:
              </span>

              <strong>
                {attendance.code}
              </strong>

              <small>
                Code expires in approximately
                10 minutes.
              </small>
            </div>
          )}
        </section>

        {/* XP */}
        <section className="card">
          <div className="card-title-row">
            <div>
              <div className="eyebrow">
                GAME ECONOMY
              </div>
              <h2>Award XP</h2>
            </div>

            <span className="admin-icon">
              ⭐
            </span>
          </div>

          {!selectedPlayer ? (
            <p className="muted">
              Select a player below to award or
              deduct XP.
            </p>
          ) : (
            <>
              <div className="selected-player">
                <div className="large-avatar small">
                  {avatars[
                    selectedPlayer.avatar
                  ] || "⭐"}
                </div>

                <div>
                  <strong>
                    {selectedPlayer.gamertag}
                  </strong>

                  <small>
                    Current XP:{" "}
                    {selectedPlayer.xp.toLocaleString()}
                  </small>
                </div>
              </div>

              <label>
                XP amount
              </label>

              <input
                value={xpAmount}
                onChange={event =>
                  setXpAmount(
                    event.target.value
                  )
                }
                type="number"
              />

              <label>
                Reason
              </label>

              <input
                value={xpReason}
                onChange={event =>
                  setXpReason(
                    event.target.value
                  )
                }
              />

              <div className="button-row">
                <button
                  className="btn"
                  onClick={giveXP}
                >
                  Record XP
                </button>

                <button
                  className="btn secondary"
                  onClick={() =>
                    setSelectedPlayer(
                      null
                    )
                  }
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {/* PLAYER LIST */}
      <section className="card section-gap">
        <div className="card-title-row">
          <div>
            <div className="eyebrow">
              PARTICIPANTS
            </div>

            <h2>Players</h2>
          </div>
        </div>

        <div className="player-admin-list">
          {players.map(player => (
            <button
              className="player-admin-row"
              key={player.id}
              onClick={() =>
                setSelectedPlayer(
                  player
                )
              }
            >
              <div className="admin-player-avatar">
                {avatars[
                  player.avatar
                ] || "⭐"}
              </div>

              <div className="admin-player-info">
                <strong>
                  {player.gamertag}
                </strong>

                <small>
                  Player #{player.id}
                </small>
              </div>

              <strong>
                {player.xp.toLocaleString()} XP
              </strong>

              <span className="row-arrow">
                →
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* COMMUNITY AWARDS */}
      <section className="card section-gap">
        <div className="card-title-row">
          <div>
            <div className="eyebrow">
              COMMUNITY
            </div>

            <h2>
              Community Recognition
            </h2>
          </div>

          <span className="admin-icon">
            ⭐
          </span>
        </div>

        {awards.length === 0 ? (
          <div className="empty-state">
            <span>🤝</span>

            <p>
              No community awards have been
              submitted yet.
            </p>
          </div>
        ) : (
          <div className="award-list">
            {awards.map(award => (
              <div
                className="award-admin-row"
                key={award.id}
              >
                <div className="award-status-icon">
                  {award.status ===
                  "approved"
                    ? "✓"
                    : award.status ===
                      "rejected"
                    ? "×"
                    : "?"}
                </div>

                <div className="award-details">
                  <strong>
                    {award.category}
                  </strong>

                  <p>
                    {award.description}
                  </p>

                  <small>
                    Submitted by:{" "}
                    {
                      award.submitted_by_name
                    }
                  </small>
                </div>

                <div className="award-xp">
                  +
                  {award.xp.toLocaleString()}
                  <small>XP</small>
                </div>

                {award.status ===
                  "pending" && (
                  <div className="button-column">
                    <button
                      className="btn"
                      onClick={() =>
                        reviewAward(
                          award,
                          "approved"
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      className="btn danger"
                      onClick={() =>
                        reviewAward(
                          award,
                          "rejected"
                        )
                      }
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CONFIGURATION */}
      <section className="card section-gap">
        <div className="card-title-row">
          <div>
            <div className="eyebrow">
              PLATFORM
            </div>

            <h2>
              Programme Configuration
            </h2>
          </div>

          <span className="admin-icon">
            ⚙️
          </span>
        </div>

        <div className="configuration-grid">
          <ConfigTile
            icon="🎨"
            title="Theme"
            description="Colours, branding and visual identity."
          />

          <ConfigTile
            icon="🗺️"
            title="Map"
            description="Replace the programme map and locations."
          />

          <ConfigTile
            icon="⭐"
            title="XP Rules"
            description="Configure points awarded for activities."
          />

          <ConfigTile
            icon="🏆"
            title="Rewards"
            description="Configure individual and group rewards."
          />

          <ConfigTile
            icon="🌳"
            title="Skill Trees"
            description="Configure progression goals and milestones."
          />

          <ConfigTile
            icon="🎯"
            title="Challenges"
            description="Create and schedule flash challenges."
          />

          <ConfigTile
            icon="📚"
            title="Resources"
            description="Manage guides, videos and partner services."
          />

          <ConfigTile
            icon="🎭"
            title="Avatars"
            description="Manage the fixed anonymous avatar library."
          />
        </div>
      </section>
    </Layout>
  );
}

function ConfigTile({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="configuration-tile">
      <span>
        {icon}
      </span>

      <div>
        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>
      </div>
    </div>
  );
}
