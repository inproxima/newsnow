import { Author, Homepage } from "@shared/consts"

export function Footer() {
  return (
    <>
      <a
        href={`${Homepage}/blob/main/LICENSE`}
        target="_blank"
        rel="noreferrer"
      >
        MIT License
      </a>
      <span>
        <span>Briefcast © 2025 · Forked from </span>
        <a href={Homepage} target="_blank" rel="noreferrer">
          newsnow
        </a>
        <span> by </span>
        <a href={Author.url} target="_blank" rel="noreferrer">
          {Author.name}
        </a>
      </span>
    </>
  )
}
