import {
  Recording,
  SongComposition,
  Musician,
  Band,
  Album,
  OralHistory,
  HistoricalDocument,
  TimelineEvent,
  Submission,
  CopyrightCase,
  AuditLogEntry,
  UserProfile,
} from '../types';

export const INITIAL_RECORDINGS: Recording[] = [
  {
    id: 'rec-001',
    songId: 'song-001',
    title: 'Kano Ni Nyasaye (1978 Stereo Master)',
    recordingTitle: 'Kano Ni Nyasaye — 1978 Nairobi Studio Master',
    artistOrBand: 'Victoria Stars Band',
    bandId: 'band-victoria-stars',
    artistId: 'mus-peter-ochieng',
    albumId: 'alb-001',
    albumTitle: 'Victoria Kings Benga Anthology Vol. 1',
    releaseYear: 1978,
    country: 'Kenya',
    region: 'Nyanza (Lake Victoria Basin)',
    language: 'Luo',
    genre: 'Benga',
    label: 'Polygram Records Kenya (Polydor AS 1042)',
    composer: 'John Ochieng',
    lyricist: 'John Ochieng & Mary Achieng',
    producer: 'A. P. Chandarana & David Amunga',
    studio: 'Polygram Studios Nairobi (Industrial Area)',
    recordingLocation: 'Nairobi, Kenya',
    duration: 274, // 4m 34s
    audioQuality: 'FLAC Master',
    audioSampleType: 'benga_fast',
    rightsStatus: 'permission_granted',
    rightsDeclaration: 'Digitized from surviving 1/4-inch reel with formal permission from the Estate of John Ochieng for non-commercial educational and cultural archive preservation.',
    verificationStatus: 'source_verified',
    coverImage: '/src/assets/images/vintage_record_sleeve_1790502822184.jpg',
    story: `Recorded in October 1978 in the legendary Polygram recording facilities in Nairobi's Industrial Area, "Kano Ni Nyasaye" represents the pinnacle of late-1970s acoustic-electric crossover Benga. Originating from the fertile plains of Kano in Kisumu County, the song transposes traditional Luo *nyatiti* (8-stringed lyre) ostinato techniques directly onto high-speed electric guitar fretboards.

Under the direction of composer John Ochieng and featuring the breathtaking dual guitar interplay between Peter Ochieng on lead and John on rhythm, the session was tracked live straight to two-track Ampex tape over two grueling afternoon takes. The lyrics praise ancestral perseverance during the heavy seasonal floods of Lake Victoria, offering gratitude for community solidarity (*Nyasaye* meaning God in Dholuo).

The record quickly spread beyond western Kenya into Tanzania and eastern Zaire, solidifying Benga as a continental force before cassette piracy drastically altered the East African commercial recording landscape in the early 1980s.`,
    recordingHistory: [
      '1974: First acoustic version performed live at Kisumu Municipal Hall.',
      '1976: Preliminary mono test pressing cut at Chandarana studio in Kericho.',
      'October 1978: Definitive stereo master cut at Polygram Studios Nairobi with sound engineer John Gardner.',
      'November 1978: 45rpm 7-inch vinyl single issued with catalog number Polydor AS 1042.',
      '1982: Re-released on vinyl compilation "Benga Giants of Lake Victoria".',
      '2026: Archival transfer performed from pristine original vinyl stamper into Banjo Heritage Repository.'
    ],
    musicians: [
      {
        musicianId: 'mus-peter-ochieng',
        musicianName: 'Peter Ochieng',
        instrument: 'Lead Guitar',
        role: 'Lead Guitarist & Soloist'
      },
      {
        musicianId: 'mus-mary-achieng',
        musicianName: 'Mary Achieng',
        instrument: 'Vocals',
        role: 'Lead Vocalist'
      },
      {
        musicianId: 'mus-john-ochieng',
        musicianName: 'John Ochieng',
        instrument: 'Rhythm Guitar',
        role: 'Composer, Arranger & Second Guitar'
      },
      {
        musicianId: 'mus-james-ouma',
        musicianName: 'James Ouma',
        instrument: 'Bass Guitar',
        role: 'Electric Bassist (Walking Syncopation)'
      },
      {
        musicianId: 'mus-george-onyango',
        musicianName: 'George Onyango',
        instrument: 'Drums',
        role: 'Drummer & Traditional Shaker'
      }
    ],
    instruments: ['Electric Lead Guitar (Ibanez Custom)', 'Rhythm Guitar (Fender Telecaster)', 'Bass Guitar (Fender Precision)', 'Drum Kit', 'Asili / Metal Shakers'],
    sources: [
      {
        id: 'src-001',
        type: 'Original record sleeve',
        title: 'Polydor AS 1042 7-inch Vinyl Sleeve & Matrix Stamp',
        publication: 'Polygram Kenya Ltd',
        year: 1978,
        notes: 'Matrix runout stamped: AS-1042-A-1 78. Shows lineup and studio location.'
      },
      {
        id: 'src-002',
        type: 'Artist interview',
        title: 'Interview with Elder John Ochieng by Mary Otieno',
        authorOrWitness: 'John Ochieng & Mary Otieno',
        year: 2026,
        notes: 'Recorded in Kisumu. Details the transition from Kericho to Nairobi studio facilities.'
      },
      {
        id: 'src-003',
        type: 'Studio documentation',
        title: 'Polygram Nairobi Studio Daily Log Book Vol. IV',
        publisher: 'East African Records Ltd Archive',
        year: 1978,
        notes: 'October 14, 1978 session notes listing 4 hours booked by Victoria Stars Band.'
      }
    ],
    disputedClaims: [
      {
        field: 'releaseYear',
        title: 'Release Year Discrepancy',
        claimA: {
          text: 'Polygram 7-inch single label lists release as 1978 (Polydor AS 1042).',
          source: 'Original Vinyl Record Sleeve (AS 1042)',
          year: 1978
        },
        claimB: {
          text: 'Band members recall test copies circulating in rural Nyanza dancehalls in late 1977 before formal Nairobi packaging.',
          source: 'Musician Oral Testimony (James Ouma)',
          year: 1977
        },
        archivistNote: 'Banjo maintains 1978 as the authoritative commercial release year while preserving the 1977 pre-release regional dancehall circulation history.'
      }
    ],
    revisions: [
      {
        id: 'rev-001',
        version: 1,
        date: '2026-03-12',
        authorName: 'Mary Otieno',
        authorRole: 'Field Archivist',
        summary: 'Initial recording entry created with studio metadata and Polygram catalog runouts.',
        changes: [
          { field: 'title', previous: '', proposed: 'Kano Ni Nyasaye (1978 Stereo Master)' },
          { field: 'composer', previous: '', proposed: 'John Ochieng' }
        ],
        status: 'approved'
      },
      {
        id: 'rev-002',
        version: 2,
        date: '2026-04-05',
        authorName: 'Senior Archivist K. Kiprop',
        authorRole: 'Senior Archivist',
        summary: 'Linked musician roster with individual instruments; added disputed release year documentation.',
        changes: [
          { field: 'lead_guitar', previous: 'Unspecified', proposed: 'Peter Ochieng' },
          { field: 'dispute_note', previous: 'None', proposed: 'Added 1977 vs 1978 regional testimony' }
        ],
        status: 'approved'
      }
    ],
    waveformPoints: [18, 35, 62, 85, 92, 76, 54, 88, 95, 78, 83, 67, 90, 82, 70, 89, 94, 60, 45, 30],
    playsCount: 14820,
    createdAt: '2026-03-12T10:14:00Z',
    updatedAt: '2026-04-05T16:22:00Z'
  },
  {
    id: 'rec-002',
    songId: 'song-001',
    title: 'Kano Ni Nyasaye (1974 Chandarana Mono Field Test)',
    recordingTitle: 'Kano Ni Nyasaye — 1974 Kericho Mono Field Pressing',
    artistOrBand: 'Victoria Jazz Band',
    bandId: 'band-victoria-stars',
    artistId: 'mus-john-ochieng',
    releaseYear: 1974,
    country: 'Kenya',
    region: 'Rift Valley / Nyanza',
    language: 'Luo',
    genre: 'Benga / Traditional Folk',
    label: 'Chandarana Records Kericho',
    composer: 'John Ochieng',
    lyricist: 'John Ochieng',
    producer: 'A. P. Chandarana',
    studio: 'Chandarana Music Store Backroom',
    recordingLocation: 'Kericho, Kenya',
    duration: 215, // 3m 35s
    audioQuality: '128kbps Stream',
    audioSampleType: 'benga_fast',
    rightsStatus: 'public_domain',
    rightsDeclaration: 'Historical field tape recording whose commercial 50-year phonogram protection period expired under East African archival preservation provisions.',
    verificationStatus: 'reviewed',
    coverImage: '/src/assets/images/vintage_record_sleeve_1790502822184.jpg',
    story: `Four years prior to the famed Nairobi stereo session, John Ochieng traveled by bus with three bandmates from Kisumu to Kericho to record on a mono Revox reel recorder in the back of A.P. Chandarana's music shop. This earlier incarnation illustrates Benga in its raw, unpolished form with single-microphone balance and driving acoustic percussion.`,
    recordingHistory: [
      'July 1974: Live single-mic mono capture in Kericho backroom.',
      'August 1974: Pressed on 500 copies 7-inch vinyl for regional juke-boxes.'
    ],
    musicians: [
      {
        musicianId: 'mus-john-ochieng',
        musicianName: 'John Ochieng',
        instrument: 'Acoustic Guitar',
        role: 'Bandleader & Vocals'
      },
      {
        musicianId: 'mus-james-ouma',
        musicianName: 'James Ouma',
        instrument: 'Bass Guitar',
        role: 'Bass'
      },
      {
        musicianId: 'mus-george-onyango',
        musicianName: 'George Onyango',
        instrument: 'Nyatiti / Shakers',
        role: 'Percussionist'
      }
    ],
    instruments: ['Acoustic Guitar', 'Acoustic Bass', 'Nyatiti', 'Shakers'],
    sources: [
      {
        id: 'src-004',
        type: 'Band member testimony',
        title: 'Kericho Session Oral Account by George Onyango',
        year: 2026,
        notes: 'Recounts recording in Chandarana backroom with only one microphone hung from ceiling.'
      }
    ],
    revisions: [
      {
        id: 'rev-003',
        version: 1,
        date: '2026-03-20',
        authorName: 'Mary Otieno',
        authorRole: 'Field Archivist',
        summary: 'Archived 1974 mono take separate from 1978 commercial stereo master.',
        changes: [{ field: 'entry', previous: 'None', proposed: 'Created 1974 recording node' }],
        status: 'approved'
      }
    ],
    waveformPoints: [10, 22, 45, 60, 75, 65, 50, 70, 80, 60, 55, 45, 60, 50, 40, 55, 60, 40, 25, 15],
    playsCount: 6310,
    createdAt: '2026-03-20T11:00:00Z',
    updatedAt: '2026-03-20T11:00:00Z'
  },
  {
    id: 'rec-003',
    songId: 'song-002',
    title: 'Pole Musa (1979 Nairobi Studio Take)',
    recordingTitle: 'Pole Musa — Studio Master 1979',
    artistOrBand: 'Orchestre Super Mazembe',
    bandId: 'band-super-mazembe',
    albumId: 'alb-002',
    albumTitle: 'Kaful Mayay & Super Mazembe Hits',
    releaseYear: 1979,
    country: 'Kenya / DR Congo',
    region: 'Kinshasa / Nairobi Cross-border',
    language: 'Lingala & Swahili',
    genre: 'Soukous / Congolese Rhumba',
    label: 'Editions Mazembe / CBS Kenya',
    composer: 'Longwa Didos',
    lyricist: 'Longwa Didos & Lovy Longomba',
    producer: 'Longwa Didos',
    studio: 'EMI Studios Nairobi',
    recordingLocation: 'Nairobi, Kenya',
    duration: 312,
    audioQuality: 'FLAC Master',
    audioSampleType: 'rhumba_slow',
    rightsStatus: 'licensed',
    rightsDeclaration: 'Digitally preserved through collaborative licensing with heirs of Editions Mazembe and regional East African Music Copyright Society.',
    verificationStatus: 'source_verified',
    coverImage: '/src/assets/images/benga_guitarist_vintage_1790502811387.jpg',
    story: `Orchestre Super Mazembe migrated from Lubumbashi (Zaire) through Tanzania into Nairobi in the early 1970s, where they established residence at the famous Garden Square club near Nairobi City Hall. "Pole Musa", sung in a heartfelt blend of Lingala and Swahili, became one of the biggest anthems in East African history.

The song exemplifies the seamless synthesis of the Congolese *seben* (the fast-paced guitar dance climax) with Kenyan guitar aesthetics. Longwa Didos' vocal leadership and Lovy Longomba's crystalline tenor harmonies captured audiences across Kenya, Uganda, and Tanzania.`,
    recordingHistory: [
      '1979: Tracked at EMI Studios Nairobi.',
      '1980: Awarded Golden Disc for sales exceeding 100,000 copies in East Africa.',
      '1983: Re-released internationally by Sterns Music London.'
    ],
    musicians: [
      {
        musicianId: 'mus-longwa-didos',
        musicianName: 'Longwa Didos',
        instrument: 'Vocals',
        role: 'Bandleader & Lead Vocals'
      },
      {
        musicianId: 'mus-lovy-longomba',
        musicianName: 'Lovy Longomba',
        instrument: 'Vocals',
        role: 'Second Vocals & Harmonies'
      },
      {
        musicianId: 'mus-alley-bukalos',
        musicianName: 'Alley Bukalos',
        instrument: 'Lead Guitar',
        role: 'Solo Guitar / Mi-Solo'
      }
    ],
    instruments: ['Electric Guitars', 'Bass Guitar', 'Congas', 'Trap Drums', 'Horns / Saxophone'],
    sources: [
      {
        id: 'src-005',
        type: 'Newspaper',
        title: 'Super Mazembe Strikes Gold in Nairobi',
        publication: 'Daily Nation Arts & Entertainment Section',
        year: 1980,
        notes: 'Front page coverage of the golden disc ceremony in Nairobi.'
      }
    ],
    revisions: [],
    waveformPoints: [12, 28, 45, 65, 75, 80, 85, 90, 95, 92, 88, 80, 85, 90, 78, 65, 55, 45, 30, 15],
    playsCount: 22400,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 'rec-004',
    songId: 'song-003',
    title: 'Water No Get Enemy (Original Afrobeat Master)',
    recordingTitle: 'Water No Get Enemy — 1975 Lagos Studio Master',
    artistOrBand: 'Fela Anikulapo Kuti & Africa 70',
    bandId: 'band-africa-70',
    albumId: 'alb-003',
    albumTitle: 'Expensive Shit',
    releaseYear: 1975,
    country: 'Nigeria',
    region: 'Lagos (Kalakuta Republic)',
    language: 'Yoruba & Pidgin',
    genre: 'Afrobeat',
    label: 'Soundwork / EMI Nigeria',
    composer: 'Fela Anikulapo Kuti',
    lyricist: 'Fela Anikulapo Kuti',
    producer: 'Fela Kuti',
    studio: 'EMI Studios Lagos (Wharf Road, Apapa)',
    recordingLocation: 'Lagos, Nigeria',
    duration: 590, // 9m 50s
    audioQuality: 'FLAC Master',
    audioSampleType: 'highlife',
    rightsStatus: 'licensed',
    rightsDeclaration: 'Archival accession with metadata verified from primary master sleeve notes and Nigerian national sound archives.',
    verificationStatus: 'source_verified',
    coverImage: '/src/assets/images/hero_african_archive_1790502799172.jpg',
    story: `Rooted in an ancient Yoruba proverb ("Omi o l'ota o" - water has no enemy), Fela Kuti's 1975 masterpiece is renowned for its sublime jazz-inflected electric piano intro and Tony Allen's hypnotic polyrhythmic drumming. Recorded during intense political resistance in Lagos, the recording is a spiritual testament to the indispensability and fluid power of human dignity.`,
    recordingHistory: [
      '1975: Recorded at EMI Studios Apapa, Lagos.',
      '1975: Released on 12-inch vinyl album "Expensive Shit".'
    ],
    musicians: [
      {
        musicianId: 'mus-fela-kuti',
        musicianName: 'Fela Anikulapo Kuti',
        instrument: 'Electric Piano / Saxophone',
        role: 'Composer, Lead Vocalist, Saxophone & Rhodes'
      },
      {
        musicianId: 'mus-tony-allen',
        musicianName: 'Tony Allen',
        instrument: 'Drums',
        role: 'Musical Director & Drummer'
      }
    ],
    instruments: ['Fender Rhodes Piano', 'Tenor Saxophone', 'Trumpet Section', 'Shekere', 'Talking Drum', 'Bass Guitar'],
    sources: [
      {
        id: 'src-006',
        type: 'Academic publication',
        title: 'Fela: The Life & Times of an African Musical Icon',
        authorOrWitness: 'Michael E. Veal',
        publisher: 'Temple University Press',
        year: 2000,
        notes: 'Detailed discography and session breakdown for 1975 Apapa recordings.'
      }
    ],
    revisions: [],
    waveformPoints: [25, 40, 55, 70, 80, 85, 90, 88, 92, 95, 90, 85, 88, 92, 85, 75, 65, 50, 35, 20],
    playsCount: 38900,
    createdAt: '2026-02-15T12:00:00Z',
    updatedAt: '2026-02-15T12:00:00Z'
  },
  {
    id: 'rec-005',
    songId: 'song-004',
    title: 'Helida Lwanda (1969 Equator Sound Recording)',
    recordingTitle: 'Helida Lwanda — 1969 Original Nairobi 7-inch',
    artistOrBand: 'Daudi Kabaka & The Equator Sound Band',
    releaseYear: 1969,
    country: 'Kenya',
    region: 'Western / Nairobi',
    language: 'Luhya & Swahili',
    genre: 'Kenyan Twist / Benga Precursor',
    label: 'Equator Sound Studios (EQ 305)',
    composer: 'Daudi Kabaka',
    lyricist: 'Daudi Kabaka',
    producer: 'Charles Worrod',
    studio: 'Equator Studios, Government Road (Moi Avenue)',
    recordingLocation: 'Nairobi, Kenya',
    duration: 184,
    audioQuality: 'FLAC Master',
    audioSampleType: 'benga_fast',
    rightsStatus: 'public_domain',
    rightsDeclaration: 'Historical East African sound recording from 1969, fully documented in national cultural holdings.',
    verificationStatus: 'rights_holder_verified',
    coverImage: '/src/assets/images/vintage_record_sleeve_1790502822184.jpg',
    story: `Daudi Kabaka is revered as the undisputed "King of Kenyan Twist". Blending Congolese fingerpicking styles pioneered by Mwenda Jean Bosco with traditional Luhya rhythmic accents, Kabaka established an infectious rhythm that dominated dance halls from Mombasa to Kampala in the late 1960s.`,
    recordingHistory: [
      '1969: Recorded at Equator Studios Nairobi.',
      '1970: Reached number one on Voice of Kenya radio chart.'
    ],
    musicians: [
      {
        musicianId: 'mus-daudi-kabaka',
        musicianName: 'Daudi Kabaka',
        instrument: 'Acoustic Guitar / Vocals',
        role: 'Composer & Soloist'
      }
    ],
    instruments: ['Acoustic Guitar', 'Electric Bass', 'Trap Drums', 'Fiddle / Accordion'],
    sources: [
      {
        id: 'src-007',
        type: 'Original record sleeve',
        title: 'Equator Records EQ 305 Label Matrix',
        publisher: 'Equator Sound Studios Ltd',
        year: 1969
      }
    ],
    revisions: [],
    waveformPoints: [15, 30, 50, 70, 85, 90, 85, 80, 85, 90, 88, 82, 80, 75, 65, 55, 45, 35, 25, 10],
    playsCount: 11200,
    createdAt: '2026-02-10T14:00:00Z',
    updatedAt: '2026-02-10T14:00:00Z'
  },
  {
    id: 'rec-006',
    songId: 'song-005',
    title: 'Mario (1985 Kinshasa Grand Master)',
    recordingTitle: 'Mario — 1985 Original Paris/Kinshasa Session',
    artistOrBand: 'Franco & Le T.P. O.K. Jazz',
    bandId: 'band-ok-jazz',
    releaseYear: 1985,
    country: 'DR Congo',
    region: 'Kinshasa',
    language: 'Lingala',
    genre: 'Congolese Rhumba',
    label: 'Editions Populaire',
    composer: 'Franco Luambo Makiadi',
    lyricist: 'Franco Luambo Makiadi',
    producer: 'Franco Luambo',
    studio: 'Studio IAD (Brazzaville) & Studio Johanna (Paris)',
    recordingLocation: 'Brazzaville & Paris',
    duration: 810, // 13m 30s
    audioQuality: 'FLAC Master',
    audioSampleType: 'rhumba_slow',
    rightsStatus: 'licensed',
    rightsDeclaration: 'Digitized from master tape preservation initiative in Kinshasa and Brussels.',
    verificationStatus: 'source_verified',
    coverImage: '/src/assets/images/benga_guitarist_vintage_1790502811387.jpg',
    story: `Considered one of the most culturally influential songs in central African history, "Mario" is a spoken-word and musical drama recounting the tale of an educated young man who refuses to seek honest employment, choosing instead to live off a wealthy older woman. Franco's piercing, conversational delivery and his signature clean hollow-body guitar countermelodies created an unparalleled continental sensation.`,
    recordingHistory: [
      '1985: First tracked in Brazzaville and mixed in Paris.',
      '1985: Certified double gold in France and across Central/West Africa.'
    ],
    musicians: [
      {
        musicianId: 'mus-franco-luambo',
        musicianName: 'Franco Luambo Makiadi',
        instrument: 'Lead Guitar & Spoken Word Vocals',
        role: 'Grand Maître & Lead Guitarist'
      },
      {
        musicianId: 'mus-madilu-system',
        musicianName: 'Madilu System',
        instrument: 'Vocals',
        role: 'Principal Vocalist'
      }
    ],
    instruments: ['Hollowbody Guitar (Gibson Byrdland)', 'Mi-Solo Guitar', 'Bass Guitar', 'Brass Section (3 Trumpets, 2 Saxophones)', 'Congas', 'Drums'],
    sources: [
      {
        id: 'src-008',
        type: 'Book',
        title: 'Congo Colossus: The Life and Legacy of Franco & OK Jazz',
        authorOrWitness: 'Graeme Ewens',
        publisher: 'Buku Press London',
        year: 1994,
        notes: 'Exhaustive examination of Mario lyricism and the Brazzaville tape sessions.'
      }
    ],
    revisions: [],
    waveformPoints: [20, 35, 50, 65, 75, 80, 85, 88, 92, 90, 85, 82, 85, 88, 80, 70, 60, 48, 32, 18],
    playsCount: 45200,
    createdAt: '2026-01-20T09:30:00Z',
    updatedAt: '2026-01-20T09:30:00Z'
  },
  {
    id: 'rec-007',
    songId: 'song-001',
    title: 'Bengaline Groove (Live at Garden Square)',
    recordingTitle: 'Bengaline Groove — Live at Garden Square Nairobi',
    artistOrBand: 'Victoria Stars Band',
    bandId: 'band-victoria-stars',
    artistId: 'mus-peter-ochieng',
    releaseYear: 1980,
    country: 'Kenya',
    region: 'Nyanza',
    language: 'Luo',
    genre: 'Benga',
    label: 'Polygram Records Kenya',
    composer: 'John Ochieng',
    lyricist: 'John Ochieng',
    producer: 'A. P. Chandarana',
    studio: 'Garden Square, Nairobi',
    recordingLocation: 'Nairobi, Kenya',
    duration: 380, // 6m 20s
    audioQuality: 'FLAC Master',
    audioSampleType: 'benga_fast',
    rightsStatus: 'permission_granted',
    rightsDeclaration: 'Live recording from Garden Square residency, digitized from audience cassette with band permission.',
    verificationStatus: 'source_verified',
    coverImage: '/src/assets/images/vintage_record_sleeve_1790502822184.jpg',
    story: `A live concert recording from 1980 capturing Victoria Stars Band at the height of their Garden Square residency. The evening featured extended improvisation sections showcasing the band's dual-lead guitar capabilities.`,
    recordingHistory: [
      '1980: Recorded live at Garden Square Nairobi during a six-night residency.',
      '2026: Archival transfer from original audience cassette into Banjo Heritage Repository.'
    ],
    musicians: [
      {
        musicianId: 'mus-peter-ochieng',
        musicianName: 'Peter Ochieng',
        instrument: 'Lead Guitar',
        role: 'Lead Guitarist & Soloist',
        isSoloist: true,
        soloOrder: 1,
        solos: [
          { startSec: 45, endSec: 78, label: '1st guitar solo' },
          { startSec: 120, endSec: 150, label: '2nd guitar solo' }
        ],
        notes: 'Panned center, uses Ibanez custom with treble boost'
      },
      {
        musicianId: 'mus-john-ochieng',
        musicianName: 'John Ochieng',
        instrument: 'Rhythm Guitar',
        role: 'Composer & Rhythm',
        isSoloist: true,
        soloOrder: 2,
        solos: [
          { startSec: 100, endSec: 130, label: 'rhythm solo' }
        ],
        notes: 'Panned left, chordal fills'
      },
      {
        musicianId: 'mus-mary-achieng',
        musicianName: 'Mary Achieng',
        instrument: 'Vocals',
        role: 'Lead Vocalist',
        isSoloist: true,
        soloOrder: 3,
        solos: [
          { startSec: 200, endSec: 240, label: 'vocalise solo' }
        ],
        notes: 'Ad lib over the groove, panned right'
      },
      {
        musicianId: 'mus-james-ouma',
        musicianName: 'James Ouma',
        instrument: 'Bass Guitar',
        role: 'Electric Bassist (Walking Syncopation)'
      },
      {
        musicianId: 'mus-george-onyango',
        musicianName: 'George Onyango',
        instrument: 'Drums',
        role: 'Drummer & Traditional Shaker'
      }
    ],
    instruments: ['Electric Lead Guitar (Ibanez Custom)', 'Rhythm Guitar (Fender Telecaster)', 'Bass Guitar (Fender Precision)', 'Drum Kit', 'Asili / Metal Shakers'],
    sources: [
      {
        id: 'src-009',
        type: 'Artist interview',
        title: 'Interview with Peter Ochieng by Mary Otieno',
        authorOrWitness: 'Peter Ochieng & Mary Otieno',
        year: 2026,
        notes: 'Details the three-guitar setup for the Garden Square residency shows.'
      },
      {
        id: 'src-010',
        type: 'Studio documentation',
        title: 'Polygram Nairobi Studio Daily Log Book Vol. V',
        publisher: 'East African Records Ltd Archive',
        year: 1980,
        notes: 'Live session notes listing 6 musicians, dual lead guitar arrangement.'
      }
    ],
    disputedClaims: [],
    revisions: [
      {
        id: 'rev-007',
        version: 1,
        date: '2026-05-01',
        authorName: 'Mary Otieno',
        authorRole: 'Field Archivist',
        summary: 'Initial recording entry with three-guitarist solo credits and live session metadata.',
        changes: [
          { field: 'musicians', previous: '5 musicians credited', proposed: '5 musicians credited with solo spans and order' }
        ],
        status: 'approved'
      }
    ],
    waveformPoints: [18, 35, 62, 85, 92, 76, 54, 88, 95, 78, 83, 67, 90, 82, 70, 89, 94, 60, 45, 30],
    playsCount: 8920,
    createdAt: '2026-05-01T10:14:00Z',
    updatedAt: '2026-05-01T16:22:00Z'
  },
  {
    id: 'rec-008',
    songId: 'song-002',
    title: 'Chandala (1974 Kericho Field Recording)',
    recordingTitle: 'Chandala — 1974 Kericho Field Test',
    artistOrBand: 'Victoria Jazz Band',
    bandId: 'band-victoria-stars',
    releaseYear: 1974,
    country: 'Kenya',
    region: 'Rift Valley / Nyanza',
    language: 'Luo',
    genre: 'Benga / Traditional Folk',
    label: 'Chandarana Records Kericho',
    composer: 'John Ochieng',
    lyricist: 'John Ochieng',
    producer: 'A. P. Chandarana',
    studio: 'Chandarana Music Store Backroom',
    recordingLocation: 'Kericho, Kenya',
    duration: 215, // 3m 35s
    audioQuality: '128kbps Stream',
    audioSampleType: 'benga_fast',
    rightsStatus: 'public_domain',
    rightsDeclaration: 'Historical field tape recording whose commercial 50-year phonogram protection period expired under East African archival preservation provisions.',
    verificationStatus: 'reviewed',
    coverImage: '/src/assets/images/vintage_record_sleeve_1790502822184.jpg',
    story: `A companion field recording to the better-known "Kano Ni Nyasaye" mono take, captured four years prior at the same Kericho location using a single microphone. This version features alternate guitar solos and a distinct vocal improvisation by John Ochieng.`,
    recordingHistory: [
      'July 1974: Live single-mic mono capture in Kericho backroom, alternate take.',
      'August 1974: Pressed on 500 copies 7-inch vinyl for regional juke-boxes as B-side.'
    ],
    musicians: [
      {
        musicianId: 'mus-john-ochieng',
        musicianName: 'John Ochieng',
        instrument: 'Acoustic Guitar',
        role: 'Bandleader & Vocals',
        isSoloist: true,
        soloOrder: 1,
        solos: [
          { startSec: 30, endSec: 65, label: '1st solo' },
          { startSec: 110, endSec: 145, label: '2nd solo' }
        ],
        notes: 'Acoustic nylon-string, panned center'
      },
      {
        musicianId: 'mus-james-ouma',
        musicianName: 'James Ouma',
        instrument: 'Bass Guitar',
        role: 'Bass'
      },
      {
        musicianId: 'mus-george-onyango',
        musicianName: 'George Onyango',
        instrument: 'Nyatiti / Shakers',
        role: 'Percussionist'
      }
    ],
    instruments: ['Acoustic Guitar', 'Acoustic Bass', 'Nyatiti', 'Shakers'],
    sources: [
      {
        id: 'src-011',
        type: 'Band member testimony',
        title: 'Kericho Session Oral Account by George Onyango',
        year: 2026,
        notes: 'Recounts the 1974 session with alternate solo sections.'
      }
    ],
    disputedClaims: [],
    revisions: [],
    lyrics: 'Luo verse chorus structure:\nVerse 1: Nyari ke nyari ba nyanja...\nChorus: Nyasaye nyasaye nyari...\nVerse 2: Olwanda olwanda...\nChorus: Nyasaye nyasaye nyari...',
    lyricsTranslation: 'English translation:\nVerse 1: Wait a bit my friend...\nChorus: Oh God oh God my friend...\nVerse 2: The Lord the Lord...\nChorus: Oh God oh God my friend...',
    lyricsVersions: [
      {
        id: 'lyr-001',
        language: 'Luo',
        isOriginal: true,
        isTranslation: false,
        lines: [
          { text: 'Nyari ke nyari ba nyanja', startSec: 0, endSec: 30, section: 'Verse 1' },
          { text: 'Nyasaye nyasaye nyari', startSec: 30, endSec: 60, section: 'Chorus' },
          { text: 'Olwanda olwanda', startSec: 60, endSec: 90, section: 'Verse 2' },
          { text: 'Nyasaye nyasaye nyari', startSec: 90, endSec: 120, section: 'Chorus' }
        ],
        lyricist: 'John Ochieng',
        transcribedBy: 'Mary Otieno',
        sourceId: 'src-011',
        isInstrumental: false,
        updatedAt: '2026-05-01T12:00:00Z'
      },
      {
        id: 'lyr-002',
        language: 'English',
        isOriginal: false,
        isTranslation: true,
        translationOfId: 'lyr-001',
        lines: [
          { text: 'Wait a bit my friend', startSec: 0, endSec: 30, section: 'Verse 1' },
          { text: 'Oh God oh God my friend', startSec: 30, endSec: 60, section: 'Chorus' },
          { text: 'The Lord the Lord', startSec: 60, endSec: 90, section: 'Verse 2' },
          { text: 'Oh God oh God my friend', startSec: 90, endSec: 120, section: 'Chorus' }
        ],
        lyricist: 'John Ochieng',
        transcribedBy: 'Mary Otieno',
        sourceId: 'src-011',
        isInstrumental: false,
        updatedAt: '2026-05-01T12:00:00Z'
      }
    ],
    waveformPoints: [10, 22, 45, 60, 75, 65, 50, 70, 80, 60, 55, 45, 60, 50, 40, 55, 60, 40, 25, 15],
    playsCount: 6310,
    createdAt: '2026-05-01T11:00:00Z',
    updatedAt: '2026-05-01T11:00:00Z'
  }
];

export const INITIAL_SONGS: SongComposition[] = [
  {
    id: 'song-001',
    title: 'Kano Ni Nyasaye',
    composer: 'John Ochieng',
    lyricist: 'John Ochieng & Mary Achieng',
    originYear: 1974,
    country: 'Kenya',
    region: 'Nyanza',
    language: 'Luo',
    genre: 'Benga',
    summary: 'A landmark East African composition praising the resilience of the Kano people against seasonal flood plains, transitioning acoustic nyatiti rhythms into electric twin guitars.',
    recordingsCount: 2,
    primaryRecordingId: 'rec-001'
  },
  {
    id: 'song-002',
    title: 'Pole Musa',
    composer: 'Longwa Didos',
    lyricist: 'Longwa Didos & Lovy Longomba',
    originYear: 1979,
    country: 'Kenya / DR Congo',
    region: 'Nairobi',
    language: 'Lingala & Swahili',
    genre: 'Soukous / Congolese Rhumba',
    summary: 'A pan-African rhumba classic bridging Congolese instrumentation with East African Swahili lyrical cadence, recorded during Super Mazembe residency in Nairobi.',
    recordingsCount: 1,
    primaryRecordingId: 'rec-003'
  },
  {
    id: 'song-003',
    title: 'Water No Get Enemy',
    composer: 'Fela Anikulapo Kuti',
    lyricist: 'Fela Anikulapo Kuti',
    originYear: 1975,
    country: 'Nigeria',
    region: 'Lagos',
    language: 'Yoruba & Pidgin',
    genre: 'Afrobeat',
    summary: 'Philosophical Yoruba composition drawing upon ancient proverbs to articulate the invincible power of nature and human endurance against oppression.',
    recordingsCount: 1,
    primaryRecordingId: 'rec-004'
  },
  {
    id: 'song-004',
    title: 'Helida Lwanda',
    composer: 'Daudi Kabaka',
    lyricist: 'Daudi Kabaka',
    originYear: 1969,
    country: 'Kenya',
    region: 'Western Kenya',
    language: 'Luhya & Swahili',
    genre: 'Kenyan Twist',
    summary: 'Pioneering Kenyan Twist track driven by rapid acoustic fingerpicking syncopated over trap drums and Latin claves.',
    recordingsCount: 1,
    primaryRecordingId: 'rec-005'
  },
  {
    id: 'song-005',
    title: 'Mario',
    composer: 'Franco Luambo Makiadi',
    lyricist: 'Franco Luambo Makiadi',
    originYear: 1985,
    country: 'DR Congo',
    region: 'Kinshasa',
    language: 'Lingala',
    genre: 'Congolese Rhumba',
    summary: 'Iconic Congolese social satire exploring post-colonial domestic dynamics and economic pride through extended spoken dialogue and interwoven guitar polyphony.',
    recordingsCount: 1,
    primaryRecordingId: 'rec-006'
  }
];

export const INITIAL_MUSICIANS: Musician[] = [
  {
    id: 'mus-peter-ochieng',
    name: 'Peter Ochieng',
    nativeSpelling: 'Ochieng Peter',
    aliases: ['Peter Ochieng', 'Ochieng Peter', 'P. Ochieng', 'Ochieng Kabaselleh Jr.'],
    role: 'Lead Guitarist & Master Improviser',
    instruments: ['Lead Guitar', 'Rhythm Guitar', 'Nyatiti'],
    birthYear: 1952,
    deathYear: 2011,
    activeYears: '1970–2008',
    country: 'Kenya',
    region: 'Nyanza (Kisumu)',
    biography: `Peter Ochieng was born near Ahero on the Kano plains of western Kenya. Initiated early into the traditional 8-stringed nyatiti lyre by his uncles, Ochieng translated the percussive thumb-and-forefinger pluck into a blistering, high-register electric guitar technique that became the defining sound of late-70s Benga.

He performed with Victoria Jazz Band before co-founding Victoria Stars Band in 1975, recording over 140 7-inch singles between Nairobi, Kisumu, and Kericho. His fluid modal shifts inspired two generations of guitarists across East and Central Africa.`,
    bands: [
      { id: 'band-victoria-jazz', name: 'Victoria Jazz Band', period: '1971–1975', role: 'Lead Guitarist' },
      { id: 'band-victoria-stars', name: 'Victoria Stars Band', period: '1975–1988', role: 'Lead Guitarist & Co-Director' }
    ],
    participatedRecordingsCount: 84,
    photoUrl: '/src/assets/images/benga_guitarist_vintage_1790502811387.jpg',
    verificationStatus: 'rights_holder_verified',
    sources: [
      {
        id: 'src-m1',
        type: 'Family testimony',
        title: 'Testimony by Grace Adhiambo Ochieng (Daughter)',
        year: 2026,
        notes: 'Confirmed birth date and early performance locations around Lake Victoria.'
      }
    ]
  },
  {
    id: 'mus-mary-achieng',
    name: 'Mary Achieng',
    nativeSpelling: 'Achieng Mary',
    aliases: ['Mary Achieng', 'Achieng Mary', 'Mama Benga'],
    role: 'Lead Vocalist & Lyricist',
    instruments: ['Lead Vocals', 'Choral Arranger', 'Percussion'],
    birthYear: 1954,
    activeYears: '1972–1995',
    country: 'Kenya',
    region: 'Nyanza',
    biography: `One of the rare celebrated women vocalists in the early golden era of East African guitar bands, Mary Achieng brought unmatched melodic clarity and lyrical authority to Victoria Stars Band. Her vocal lines carried rich social commentary, celebrating maternal resilience and community fortitude.`,
    bands: [
      { id: 'band-victoria-stars', name: 'Victoria Stars Band', period: '1975–1985', role: 'Lead Vocalist' }
    ],
    participatedRecordingsCount: 42,
    photoUrl: '/src/assets/images/oral_history_studio_1790502830749.jpg',
    verificationStatus: 'source_verified',
    sources: [
      {
        id: 'src-m2',
        type: 'Artist interview',
        title: 'Voice of Kenya Radio Archive Interview with Mary Achieng',
        year: 1983
      }
    ]
  },
  {
    id: 'mus-john-ochieng',
    name: 'John Ochieng',
    nativeSpelling: 'Ochieng John',
    aliases: ['John Ochieng', 'Ochieng John', 'J. Ochieng'],
    role: 'Composer, Arranger & Bandleader',
    instruments: ['Rhythm Guitar', 'Acoustic Guitar', 'Vocals'],
    birthYear: 1948,
    deathYear: 2004,
    activeYears: '1966–2000',
    country: 'Kenya',
    region: 'Nyanza',
    biography: `John Ochieng was the visionary composer behind dozens of seminal Benga recordings. Recognizing the sonic potential of merging regional communal melodies with modern amplified instruments, he established partnerships with independent label pioneers like A.P. Chandarana in Kericho and David Amunga in Nairobi.`,
    bands: [
      { id: 'band-victoria-stars', name: 'Victoria Stars Band', period: '1975–1992', role: 'Composer & Bandleader' }
    ],
    participatedRecordingsCount: 110,
    photoUrl: '/src/assets/images/oral_history_studio_1790502830749.jpg',
    verificationStatus: 'source_verified',
    sources: [
      {
        id: 'src-m3',
        type: 'Newspaper',
        title: 'Remembering John Ochieng, Architect of Lake Victoria Melodies',
        publication: 'The Daily Nation',
        year: 2004
      }
    ]
  },
  {
    id: 'mus-tony-allen',
    name: 'Tony Allen',
    aliases: ['Tony Oladipo Allen', 'Tony Allen'],
    role: 'Pioneering Afrobeat Drummer & Composer',
    instruments: ['Drum Kit', 'Talking Drum', 'Percussion'],
    birthYear: 1940,
    deathYear: 2020,
    activeYears: '1960–2020',
    country: 'Nigeria',
    region: 'Lagos',
    biography: `Widely hailed as one of the greatest drummers in the history of music, Tony Allen co-created Afrobeat alongside Fela Kuti. His unique polyrhythmic technique fused traditional Yoruba percussion, highlife patterns, and American jazz syncopation. Brian Eno famously remarked that Tony Allen sounded like five drummers at once.`,
    bands: [
      { id: 'band-koola-lobitos', name: 'Koola Lobitos', period: '1964–1969', role: 'Drummer' },
      { id: 'band-africa-70', name: 'Africa 70', period: '1970–1979', role: 'Musical Director & Drummer' }
    ],
    participatedRecordingsCount: 160,
    photoUrl: '/src/assets/images/benga_guitarist_vintage_1790502811387.jpg',
    verificationStatus: 'rights_holder_verified',
    sources: [
      {
        id: 'src-m4',
        type: 'Book',
        title: 'Tony Allen: An Autobiography of the Master Drummer of Afrobeat',
        authorOrWitness: 'Tony Allen with Michael E. Veal',
        publisher: 'Duke University Press',
        year: 2013
      }
    ]
  },
  {
    id: 'mus-franco-luambo',
    name: 'Franco Luambo Makiadi',
    nativeSpelling: 'François Luambo Luanzo Makiadi',
    aliases: ['Franco', 'Grand Maître Franco', 'Le Sorcier de la Guitare'],
    role: 'Composer, Guitarist & Orchestre T.P. OK Jazz Bandleader',
    instruments: ['Hollowbody Electric Guitar', 'Vocals', 'Bass'],
    birthYear: 1938,
    deathYear: 1989,
    activeYears: '1953–1989',
    country: 'DR Congo',
    region: 'Bas-Congo / Kinshasa',
    biography: `Known across Africa as the "Sorcerer of the Guitar", Franco led Orchestre T.P. OK Jazz for over three decades, issuing more than 150 albums and over 1,000 songs. He revolutionized Congolese Rhumba by expanding its brass arrangements and weaving intricate multipart guitar counterpoints.`,
    bands: [
      { id: 'band-ok-jazz', name: 'T.P. OK Jazz', period: '1956–1989', role: 'Grand Maître & Lead Guitarist' }
    ],
    participatedRecordingsCount: 450,
    photoUrl: '/src/assets/images/benga_guitarist_vintage_1790502811387.jpg',
    verificationStatus: 'source_verified',
    sources: [
      {
        id: 'src-m5',
        type: 'Academic publication',
        title: 'Rumba on the River: A History of the Popular Music of the Two Congos',
        authorOrWitness: 'Gary Stewart',
        publisher: 'Verso Books',
        year: 2000
      }
    ]
  },
  {
    id: 'mus-daudi-kabaka',
    name: 'Daudi Kabaka',
    aliases: ['Daudi Kabaka', 'King of Twist'],
    role: 'Pioneer of Kenyan Twist & Acoustic Guitarist',
    instruments: ['Acoustic Guitar', 'Vocals'],
    birthYear: 1939,
    deathYear: 2001,
    activeYears: '1954–1998',
    country: 'Kenya',
    region: 'Western Kenya',
    biography: `A pillar of 1960s East African popular culture, Daudi Kabaka popularized Kenyan Twist with songs like 'African Twist', 'Helida Lwanda', and 'Harambee Harambee'. His energetic fingerpicking style combined indigenous Luhya melodies with urban Nairobi dance energy.`,
    bands: [
      { id: 'band-equator-sound', name: 'Equator Sound Band', period: '1962–1972', role: 'Principal Guitarist & Singer' }
    ],
    participatedRecordingsCount: 95,
    photoUrl: '/src/assets/images/oral_history_studio_1790502830749.jpg',
    verificationStatus: 'source_verified',
    sources: [
      {
        id: 'src-m6',
        type: 'Government archive',
        title: 'Kenya National Archives: Cultural Heritage Sound Collection Vol. 8',
        year: 1985
      }
    ]
  }
];

export const INITIAL_BANDS: Band[] = [
  {
    id: 'band-victoria-stars',
    name: 'Victoria Stars Band',
    formationYear: 1971,
    disbandYear: 1992,
    country: 'Kenya',
    region: 'Nyanza',
    genre: 'Benga',
    overview: 'Pioneering Benga outfit formed on the shores of Lake Victoria, revered for introducing interlocking electric guitars that defined Kenyan dance halls in the 1970s.',
    history: `Formed originally in Kisumu in 1971 as an offshoot of the early Victoria Kings collective, the group relocated to Nairobi in 1975 to record with major labels including Chandarana, ASL, and Polygram.

Their membership evolved across distinct periods: the early foundation (1971–1975) featured John Ochieng developing raw modal melodies on acoustic instruments; from 1975 onwards, with the arrival of Peter Ochieng on lead guitar and Mary Achieng on vocals, the band reached continental acclaim.`,
    membersTimeline: [
      { period: '1971–1975', musicianId: 'mus-john-ochieng', musicianName: 'John Ochieng', instrument: 'Guitar & Vocals', isFounder: true },
      { period: '1971–1975', musicianId: 'mus-james-ouma', musicianName: 'James Ouma', instrument: 'Bass Guitar', isFounder: true },
      { period: '1975–1982', musicianId: 'mus-peter-ochieng', musicianName: 'Peter Ochieng', instrument: 'Lead Guitar' },
      { period: '1975–1985', musicianId: 'mus-mary-achieng', musicianName: 'Mary Achieng', instrument: 'Lead Vocals' },
      { period: '1975–1990', musicianId: 'mus-george-onyango', musicianName: 'George Onyango', instrument: 'Drums & Percussion' }
    ],
    photoUrl: '/src/assets/images/benga_guitarist_vintage_1790502811387.jpg',
    recordingsCount: 84,
    albumsCount: 6,
    verificationStatus: 'source_verified',
    sources: [
      {
        id: 'src-b1',
        type: 'Original record sleeve',
        title: 'Polydor Kenya LP Sleevenotes: The Story of Victoria Stars',
        year: 1979
      }
    ]
  },
  {
    id: 'band-super-mazembe',
    name: 'Orchestre Super Mazembe',
    formationYear: 1974,
    disbandYear: 1999,
    country: 'Kenya / DR Congo',
    region: 'Kinshasa & Nairobi',
    genre: 'Soukous / Congolese Rhumba',
    overview: 'Legendary Congolese group who took up residency in Kenya, bridging Lingala poetic ballads with the driving rhythms of urban East Africa.',
    history: `Beginning in Likasi and Lubumbashi as Super Vox, the band traversed Tanzania and settled in Nairobi during 1974. Resident at Nairobi's Garden Square, they produced enduring continental hits like 'Shauriyako', 'Kasongo', and 'Pole Musa'.`,
    membersTimeline: [
      { period: '1974–1988', musicianId: 'mus-longwa-didos', musicianName: 'Longwa Didos', instrument: 'Vocals & Bandleader', isFounder: true },
      { period: '1974–1984', musicianId: 'mus-lovy-longomba', musicianName: 'Lovy Longomba', instrument: 'Vocals', isFounder: true },
      { period: '1976–1986', musicianId: 'mus-alley-bukalos', musicianName: 'Alley Bukalos', instrument: 'Lead Guitar' }
    ],
    photoUrl: '/src/assets/images/benga_guitarist_vintage_1790502811387.jpg',
    recordingsCount: 62,
    albumsCount: 8,
    verificationStatus: 'source_verified',
    sources: [
      {
        id: 'src-b2',
        type: 'Book',
        title: 'Congolese Musicians in East Africa: 1970–1990',
        authorOrWitness: 'Kenyan Cultural Council Archive',
        year: 2005
      }
    ]
  },
  {
    id: 'band-africa-70',
    name: 'Fela Kuti & Africa 70',
    formationYear: 1970,
    disbandYear: 1979,
    country: 'Nigeria',
    region: 'Lagos',
    genre: 'Afrobeat',
    overview: 'The powerhouse ensemble that developed Afrobeat at the Afrika Shrine in Lagos, combining jazz improvisation, Yoruba rhythms, and political resistance.',
    history: `Africa 70 served as Fela Kuti's musical engine throughout the 1970s. With Tony Allen directing the rhythm section and a towering horn lineup, the band performed relentless marathon sets at the Afrika Shrine and recorded historical albums like Zombie, Expensive Shit, and Shakara.`,
    membersTimeline: [
      { period: '1970–1979', musicianId: 'mus-fela-kuti', musicianName: 'Fela Kuti', instrument: 'Saxophone / Keys', isFounder: true },
      { period: '1970–1979', musicianId: 'mus-tony-allen', musicianName: 'Tony Allen', instrument: 'Drums', isFounder: true }
    ],
    photoUrl: '/src/assets/images/hero_african_archive_1790502799172.jpg',
    recordingsCount: 50,
    albumsCount: 22,
    verificationStatus: 'source_verified',
    sources: []
  },
  {
    id: 'band-ok-jazz',
    name: 'Orchestre T.P. O.K. Jazz',
    formationYear: 1956,
    disbandYear: 1993,
    country: 'DR Congo',
    region: 'Kinshasa',
    genre: 'Congolese Rhumba',
    overview: 'The preeminent Congolese orchestra that codified modern Rhumba across four decades under Grand Maître Franco Luambo Makiadi.',
    history: `Founded in Leopoldville (now Kinshasa) in 1956, T.P. OK Jazz (Tout Puissant Orchestre Kinshasa Jazz) grew from an intimate tavern combo into a sprawling 40-piece collective that toured internationally and documented central African society through monumental recordings.`,
    membersTimeline: [
      { period: '1956–1989', musicianId: 'mus-franco-luambo', musicianName: 'Franco Luambo Makiadi', instrument: 'Lead Guitar', isFounder: true },
      { period: '1980–1989', musicianId: 'mus-madilu-system', musicianName: 'Madilu System', instrument: 'Vocals' }
    ],
    photoUrl: '/src/assets/images/benga_guitarist_vintage_1790502811387.jpg',
    recordingsCount: 380,
    albumsCount: 110,
    verificationStatus: 'source_verified',
    sources: []
  }
];

export const INITIAL_ALBUMS: Album[] = [
  {
    id: 'alb-001',
    title: 'Victoria Kings Benga Anthology Vol. 1',
    artistOrBand: 'Victoria Stars Band',
    year: 1978,
    label: 'Polygram Records Kenya (Polydor ASLP 102)',
    producer: 'A. P. Chandarana',
    recordingLocation: 'Nairobi, Kenya',
    historicalStory: 'Compiled during the golden commercial peak of Benga, this LP brought together top singles previously only available on fragile 45rpm pressings, introducing studio stereo panning to traditional guitar lines.',
    coverUrl: '/src/assets/images/vintage_record_sleeve_1790502822184.jpg',
    trackList: [
      { trackNumber: 1, recordingId: 'rec-001', title: 'Kano Ni Nyasaye', duration: '4:34' },
      { trackNumber: 2, recordingId: 'rec-002', title: 'Kano Ni Nyasaye (1974 Mono Take)', duration: '3:35' }
    ],
    musicians: ['Peter Ochieng', 'Mary Achieng', 'John Ochieng', 'James Ouma', 'George Onyango'],
    documents: ['doc-001', 'doc-003']
  },
  {
    id: 'alb-002',
    title: 'Kaful Mayay & Super Mazembe Hits',
    artistOrBand: 'Orchestre Super Mazembe',
    year: 1979,
    label: 'Editions Mazembe (EM-04)',
    producer: 'Longwa Didos',
    recordingLocation: 'EMI Studios Nairobi',
    historicalStory: 'Recorded after months of capacity crowds at Garden Square, this vinyl release solidified the Zairean musicians status in Kenyan popular memory.',
    coverUrl: '/src/assets/images/benga_guitarist_vintage_1790502811387.jpg',
    trackList: [
      { trackNumber: 1, recordingId: 'rec-003', title: 'Pole Musa', duration: '5:12' }
    ],
    musicians: ['Longwa Didos', 'Lovy Longomba', 'Alley Bukalos'],
    documents: ['doc-002']
  }
];

export const INITIAL_ORAL_HISTORIES: OralHistory[] = [
  {
    id: 'oral-001',
    title: 'From Nyatiti to Electric Guitars: The Kericho Backroom Sessions',
    interviewee: 'John Ochieng',
    intervieweeRole: 'Bandleader, Victoria Stars Band',
    interviewer: 'Mary Otieno',
    date: '12 March 2026',
    location: 'Kisumu, Kenya',
    duration: '18m 45s',
    audioSampleType: 'rhumba_slow',
    summary: 'A rare first-person account of how young Luo musicians adapted acoustic 8-string lyre rhythms onto imported electric guitars in Kericho and Nairobi tea estates during the 1970s.',
    transcriptEn: `Mary Otieno: "Elder John, take us back to 1974 when you first brought the band to Kericho to record with Chandarana."
John Ochieng: "We didn't have amplifers like today. We arrived on the evening bus from Kisumu with only two guitars and a shaker. Mr. Chandarana had cleared the back of his shop where bags of flour were stored. He hung one silver microphone from the timber beam.

He told us: 'You sing once. If anyone misses a note, the lacquer disc is ruined.' So Peter Ochieng tuned the lead strings high, mimicking the nyatiti timbre. When George hit the metal shaker, we played Kano Ni Nyasaye in one breath. The sound that came out surprised even the shopkeeper."`,
    transcriptSw: `Mary Otieno: "Mzee John, turudishe mwaka wa 1974 mlipopeleka bendi Kericho kurekodi na Chandarana."
John Ochieng: "Hatukuwa na amplifaya kama leo. Tulifika na basi ya jioni kutoka Kisumu tukiwa na gitaa mbili tu na kigogo. Bwana Chandarana alikuwa amesafisha nyuma ya duka lake ambapo magunia ya unga yaliwekwa. Alitundika maikrofoni moja ya fedha kutoka kwenye boriti ya mbao.

Alituambia: 'Mnaimba mara moja tu. Yeyote akikosea nukuu, sahani ya santuri imeharibika.' Kwa hivyo Peter Ochieng alipiga gitaa ya kwanza kwa sauti kali akifuata nyatiti. George alipogonga chuma, tulicheza 'Kano Ni Nyasaye' kwa pumzi moja."`,
    photoUrl: '/src/assets/images/oral_history_studio_1790502830749.jpg',
    keyEntities: {
      musicians: ['John Ochieng', 'Peter Ochieng', 'George Onyango'],
      bands: ['Victoria Stars Band', 'Victoria Jazz Band'],
      places: ['Kericho', 'Kisumu', 'Nairobi'],
      dates: ['1974', '1978']
    },
    sources: [
      {
        id: 'src-o1',
        type: 'Artist interview',
        title: 'Banjo Digital Oral Preservation Archive Project Session 14',
        authorOrWitness: 'Mary Otieno',
        year: 2026
      }
    ]
  },
  {
    id: 'oral-002',
    title: 'The Great Congo to Nairobi Exodus of 1974',
    interviewee: 'Longwa Didos',
    intervieweeRole: 'Bandleader, Orchestre Super Mazembe',
    interviewer: 'David Ondieki',
    date: '18 January 2026',
    location: 'Nairobi, Kenya',
    duration: '24m 10s',
    audioSampleType: 'rhumba_slow',
    summary: 'The chronicle of Congolese rumba ensembles traveling across East Africa to settle in Nairobi, transforming the capital into the recording capital of the continent.',
    transcriptEn: `David Ondieki: "What drew your orchestra from Lubumbashi all the way to Nairobi?"
Longwa Didos: "Nairobi in the mid-70s had the finest vinyl pressing plants in tropical Africa. Between Polygram and CBS, you could cut a master tape on Tuesday and hear your 45 on the jukebox by Saturday evening. We played six nights a week at Garden Square, blending Lingala melodies with the Swahili that our audiences spoke on the street."`,
    transcriptSw: `David Ondieki: "Nini kiliivutia orkestra yako kutoka Lubumbashi hadi Nairobi?"
Longwa Didos: "Nairobi katikati ya miaka ya sabini ilikuwa na viwanda bora zaidi vya kukata santuri za santuri katika Afrika ya kitropiki. Kati ya Polygram na CBS, ungeweza kurekodi tepe ya kwanza Jumanne na kusikia wimbo wako kwenye jukwaa la muziki ifikapo Jumamosi jioni."`,
    photoUrl: '/src/assets/images/oral_history_studio_1790502830749.jpg',
    keyEntities: {
      musicians: ['Longwa Didos', 'Lovy Longomba'],
      bands: ['Orchestre Super Mazembe', 'Super Vox'],
      places: ['Lubumbashi', 'Nairobi', 'Garden Square Club'],
      dates: ['1974', '1979']
    },
    sources: [
      {
        id: 'src-o2',
        type: 'Artist interview',
        title: 'Oral History Project Series 09',
        year: 2026
      }
    ]
  }
];

export const INITIAL_DOCUMENTS: HistoricalDocument[] = [
  {
    id: 'doc-001',
    title: 'Polygram Records Kenya Master Session Sheet (Oct 1978)',
    type: 'studio_document',
    year: 1978,
    country: 'Kenya',
    location: 'Industrial Area, Nairobi',
    archivalCode: 'POL-NRB-78-1042',
    description: 'Surviving hand-annotated 2-inch tape box sheet documenting track assignments, engineer remarks, and take notes for Victoria Stars Band session.',
    imageUrl: '/src/assets/images/hero_african_archive_1790502799172.jpg',
    relatedSongIds: ['rec-001'],
    relatedBandIds: ['band-victoria-stars'],
    sourceAttribution: 'East African Sound Preservation Trust Archive'
  },
  {
    id: 'doc-002',
    title: 'Garden Square Nairobi Concert Handbill & Roster (1979)',
    type: 'poster',
    year: 1979,
    country: 'Kenya',
    location: 'City Hall Way, Nairobi',
    archivalCode: 'POST-NRB-79-GS',
    description: 'Silk-screened promotional poster announcing the six-night residency of Orchestre Super Mazembe with admission priced at 15 Kenya Shillings.',
    imageUrl: '/src/assets/images/benga_guitarist_vintage_1790502811387.jpg',
    relatedSongIds: ['rec-003'],
    relatedBandIds: ['band-super-mazembe'],
    sourceAttribution: 'Private Ephemera Collection of David Amunga'
  },
  {
    id: 'doc-003',
    title: 'Chandarana 45 RPM Matrix Runout Stamp Card (1974)',
    type: 'record_sleeve',
    year: 1974,
    country: 'Kenya',
    location: 'Kericho, Kenya',
    archivalCode: 'CHAN-KER-74-098',
    description: 'Original cardboard sleeve for the 7-inch mono pressing featuring bilingual lyrics and handwritten engineer wax stamp AS-1042.',
    imageUrl: '/src/assets/images/vintage_record_sleeve_1790502822184.jpg',
    relatedSongIds: ['rec-002'],
    relatedBandIds: ['band-victoria-stars'],
    sourceAttribution: 'Kericho Music Preservation Holding'
  },
  {
    id: 'doc-004',
    title: 'Kenya Daily Nation Article: "Benga Takes The Continent" (1980)',
    type: 'newspaper_article',
    year: 1980,
    country: 'Kenya',
    location: 'Nairobi',
    archivalCode: 'DN-80-08-14',
    description: 'Feature article analyzing the cultural explosion of Western Kenyan guitar bands across Lagos, Kinshasa, and Harare.',
    imageUrl: '/src/assets/images/hero_african_archive_1790502799172.jpg',
    relatedSongIds: ['rec-001'],
    relatedBandIds: ['band-victoria-stars'],
    sourceAttribution: 'National Library Services of Kenya'
  }
];

export const INITIAL_TIMELINE: TimelineEvent[] = [
  {
    year: 1956,
    title: 'Founding of Orchestre T.P. OK Jazz in Leopoldville',
    category: 'band_formed',
    country: 'DR Congo',
    description: 'Franco Luambo Makiadi and associates establish OK Jazz at OK Bar in Leopoldville, setting the course for continental Congolese Rhumba.',
    relatedBandId: 'band-ok-jazz',
    relatedMusicianId: 'mus-franco-luambo'
  },
  {
    year: 1962,
    title: 'Daudi Kabaka Records First Kenyan Twist Singles',
    category: 'first_recording',
    country: 'Kenya',
    description: 'Equator Sound Studios in Nairobi cuts early twist tracks blending acoustic Luhya fingerpicking with Latin rhythms.',
    relatedRecordingId: 'rec-005',
    relatedMusicianId: 'mus-daudi-kabaka'
  },
  {
    year: 1970,
    title: 'Fela Kuti Founds Africa 70 & The Afrika Shrine',
    category: 'band_formed',
    country: 'Nigeria',
    description: 'Following his return from the United States, Fela Kuti reorganizes Koola Lobitos with Tony Allen into Africa 70, unleashing Afrobeat.',
    relatedBandId: 'band-africa-70',
    relatedMusicianId: 'mus-fela-kuti'
  },
  {
    year: 1971,
    title: 'Victoria Stars Band Formed in Kisumu',
    category: 'band_formed',
    country: 'Kenya',
    description: 'John Ochieng and peers form the ensemble that would electrify traditional Luo nyatiti patterns on western electric instruments.',
    relatedBandId: 'band-victoria-stars',
    relatedMusicianId: 'mus-john-ochieng'
  },
  {
    year: 1974,
    title: 'Super Mazembe Migrates from Zaire to Nairobi',
    category: 'historical_event',
    country: 'Kenya / DR Congo',
    description: 'Congolese musicians take up permanent residence in Nairobi, igniting a decade of cross-border musical innovation.',
    relatedBandId: 'band-super-mazembe'
  },
  {
    year: 1975,
    title: 'Peter Ochieng Joins Victoria Stars as Lead Guitarist',
    category: 'lineup_change',
    country: 'Kenya',
    description: 'Peter Ochieng takes over lead guitar duties, introducing the iconic high-tempo fingerpicked solos that defined the genre.',
    relatedBandId: 'band-victoria-stars',
    relatedMusicianId: 'mus-peter-ochieng'
  },
  {
    year: 1978,
    title: 'Kano Ni Nyasaye Stereo Master Cut at Polygram Nairobi',
    category: 'album_released',
    country: 'Kenya',
    description: 'Definitive stereo recording of the classic Benga anthem recorded on 2-inch tape in Nairobi Industrial Area.',
    relatedRecordingId: 'rec-001'
  },
  {
    year: 1985,
    title: 'Franco Releases "Mario" in Kinshasa & Paris',
    category: 'album_released',
    country: 'DR Congo',
    description: 'Cultural tour de force released across Africa and Europe, sparking debate on economic independence and modern urban relationships.',
    relatedRecordingId: 'rec-006',
    relatedBandId: 'band-ok-jazz',
    relatedMusicianId: 'mus-franco-luambo'
  }
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-001',
    type: 'recording',
    title: 'Chakacha Ya Pwani — 1982 Mombasa Taarab Session',
    contributorName: 'Fatuma Al-Amin',
    contributorEmail: 'fatuma.alamin@mombasarts.ke',
    submittedAt: '2026-09-24T14:30:00Z',
    category: 'Taarab / Swahili Coastal Heritage',
    priority: 'normal',
    status: 'pending',
    rightsDeclaration: 'Digitized from physical cassette tape belonging to my late uncle with family estate authorization.',
    proposedData: {
      title: 'Chakacha Ya Pwani',
      band: 'Mvita Stars Taarab Club',
      year: '1982',
      studio: 'Mombasa Sound Studio',
      leadInstrument: 'Taarab Accordion & Kanun'
    },
    sourcesProvided: 'Original Maxell Cassette inlay card with handwritten track names and 1982 wedding performance photo.'
  },
  {
    id: 'sub-002',
    type: 'edit',
    title: 'Add Second Guitarist Credit to "Pole Musa" 1979 Session',
    contributorName: 'Bukalos Alley Jr.',
    contributorEmail: 'alley.bukalos@heritage.cd',
    submittedAt: '2026-09-25T09:15:00Z',
    category: 'Musician Attribution',
    priority: 'high',
    status: 'pending',
    rightsDeclaration: 'Family member of credited musician with documentary proof.',
    currentData: {
      musicians: 'Longwa Didos (Vocals), Lovy Longomba (Vocals), Alley Bukalos (Lead Guitar)'
    },
    proposedData: {
      musicians: 'Longwa Didos (Vocals), Lovy Longomba (Vocals), Alley Bukalos (Lead Guitar), Atia Denis (Rhythm Mi-Solo)'
    },
    sourcesProvided: 'CBS Kenya contract agreement dated August 1979 showing Atia Denis signature.'
  },
  {
    id: 'sub-003',
    type: 'correction',
    title: 'Dispute Recording Studio for 1974 Victoria Jazz Band Single',
    contributorName: 'Dr. Joseph Nyasani',
    contributorEmail: 'j.nyasani@uonbi.ac.ke',
    submittedAt: '2026-09-26T11:45:00Z',
    category: 'Historical Accuracy',
    priority: 'normal',
    status: 'pending',
    rightsDeclaration: 'Academic research citation from University of Nairobi Ethnomusicology department.',
    currentData: {
      studio: 'Nairobi Studios'
    },
    proposedData: {
      studio: 'Chandarana Music Store Backroom, Kericho'
    },
    sourcesProvided: 'Published paper in African Music Journal Vol. 14, pp. 88-102.'
  }
];

export const INITIAL_COPYRIGHT_CASES: CopyrightCase[] = [
  {
    id: 'case-001',
    caseNumber: 'BANJO-CR-2026-041',
    recordingId: 'rec-001',
    recordingTitle: 'Kano Ni Nyasaye (1978 Stereo Master)',
    artistOrBand: 'Victoria Stars Band',
    claimantName: 'Kenya Copyright Board (KECOBO) Observer Desk',
    claimantEmail: 'inquiries@kecobo.go.ke',
    claimType: 'disputed_credit',
    evidenceSummary: 'Notification requesting confirmation that surviving heirs of John Ochieng are registered with Music Copyright Society of Kenya for royalty distributions.',
    filedDate: '2026-09-18',
    status: 'investigating'
  },
  {
    id: 'case-002',
    caseNumber: 'BANJO-CR-2026-039',
    recordingId: 'rec-003',
    recordingTitle: 'Pole Musa',
    artistOrBand: 'Orchestre Super Mazembe',
    claimantName: 'Kinshasa Sound Heritage Society',
    claimantEmail: 'legal@kinshasamusic.org',
    claimType: 'ownership',
    evidenceSummary: 'Cross-border verification of original Zaire 1976 pre-publishing rights prior to Kenya CBS licensing.',
    filedDate: '2026-09-12',
    status: 'open'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    who: 'Senior Archivist K. Kiprop',
    what: 'Approved Song Revision #2 for rec-001',
    when: '2026-04-05 16:22 UTC',
    where: 'Song Repository / rec-001',
    before: 'Lead Guitar: Unspecified · Dispute: None',
    after: 'Lead Guitar: Peter Ochieng · Dispute: Added 1977 vs 1978 regional testimony note',
    reason: 'Verified through original Polydor AS 1042 sleeve notes and interview cross-check.'
  },
  {
    id: 'log-002',
    who: 'Platform Administrator A. Ndung\'u',
    what: 'Updated Rights Status for rec-002 from unverified to public_domain',
    when: '2026-03-20 11:30 UTC',
    where: 'Rights Management Console',
    before: 'rights_status: unverified',
    after: 'rights_status: public_domain',
    reason: 'Phonogram protection expired under Section 23 of Kenya Copyright Act for 1974 field take.'
  }
];

export const CURRENT_USER_PROFILE: UserProfile = {
  id: 'usr-001',
  displayName: 'Mary Otieno',
  email: 'mary.otieno@banjo.africa',
  role: 'senior_archivist',
  avatarUrl: '/src/assets/images/oral_history_studio_1790502830749.jpg',
  bio: 'Field musicologist and sound archivist dedicated to documenting Lake Victoria Benga, Congolese rumba migrations, and safeguarding original master recordings across East Africa.',
  verifiedStatus: true,
  contributionsCount: 70,
  songsSubmitted: 23,
  editsSubmitted: 47,
  editsApproved: 41,
  pendingReview: 4,
  rejectedEdits: 2,
  savedRecordingIds: ['rec-001', 'rec-003', 'rec-004'],
  bookmarkedPages: [
    { type: 'song', id: 'rec-001', title: 'Kano Ni Nyasaye (1978 Stereo Master)' },
    { type: 'band', id: 'band-victoria-stars', title: 'Victoria Stars Band' },
    { type: 'musician', id: 'mus-peter-ochieng', title: 'Peter Ochieng' }
  ],
  playlists: [
    {
      id: 'pl-001',
      name: '1970s Kenyan Benga Giants',
      description: 'Essential guitar interplay from Western Kenya, Nyanza, and Nairobi dance halls.',
      songIds: ['rec-001', 'rec-002', 'rec-005']
    },
    {
      id: 'pl-002',
      name: 'Kinshasa-Nairobi Rhumba Corridor',
      description: 'Cross-border anthems from Congolese musicians who redefined East African nightlife.',
      songIds: ['rec-003', 'rec-006']
    }
  ]
};
