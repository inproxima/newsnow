import type { FixedColumnID } from "@shared/types"
import { useTitle } from "react-use"
import { NavBar } from "../navbar"
import { Dnd } from "./dnd"
import { currentColumnIDAtom, lastActiveColumnAtom } from "~/atoms"

export function Column({ id }: { id: FixedColumnID }) {
  const [currentColumnID, setCurrentColumnID] = useAtom(currentColumnIDAtom)
  const [, setLastActiveColumn] = useAtom(lastActiveColumnAtom)

  useEffect(() => {
    setCurrentColumnID(id)
    // Track last active column in preferences
    setLastActiveColumn(id)
  }, [id, setCurrentColumnID, setLastActiveColumn])

  useTitle(`Briefcast | ${metadata[id].name}`)

  return (
    <>
      <div className="flex justify-center md:hidden mb-6">
        <NavBar />
      </div>
      {id === currentColumnID && <Dnd />}
    </>
  )
}
