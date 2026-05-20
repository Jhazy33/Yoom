# Yoom R2 File Organization Structure

## Bucket: cih-consultingllc

## Folder Structure:
```
cih-consultingllc/
├── yoom-videos/
│   ├── {video-uuid}/
│   │   ├── video.webm          # Original recording
│   │   ├── transcript.json     # AI transcription
│   │   ├── metadata.json       # Recording details (date, duration, title)
│   │   └── thumbnail.jpg       # Video thumbnail
```

## Example:
```
cih-consultingllc/
├── yoom-videos/
│   ├── a1b2c3d4-e5f6-7890/
│   │   ├── video.webm
│   │   ├── transcript.json
│   │   ├── metadata.json
│   │   └── thumbnail.jpg
│   ├── f7e8d9c0-b1a2-3456/
│   │   ├── video.webm
│   │   ├── transcript.json
│   │   ├── metadata.json
│   │   └── thumbnail.jpg
```

## Benefits:
- Each recording gets its own folder
- Easy to manage/delete individual recordings
- Related files stay together
- Can add more metadata later without clutter
