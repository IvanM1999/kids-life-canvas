# Kids Life Canvas

## Principles

- local-first by default
- offline capable
- private by design
- cloud import as optional integration
- memories are interconnected, not isolated files

## Core entities

- Child
- Person
- Event
- Memory
- MediaItem
- Album
- Place
- CloudConnection
- SyncJob

## Relationships

- Child has many events and media
- Event relates to one or more people, places, and albums
- MediaItem belongs to a child and can be linked to multiple memories
- Album groups events and media by theme or year
- CloudConnection stores OAuth tokens and sync configuration

## Data flow

1. User imports media locally or from cloud
2. File metadata is extracted and stored locally
3. Media and notes are attached to events or children
4. Timeline, gallery, and canvas are derived from the same indexed database
5. Sync jobs update from cloud adapters only when online
