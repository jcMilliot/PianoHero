interface Props {
  onClose: () => void;
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-2">
    <h3 className="font-display text-base text-hand-right">{title}</h3>
    <div className="space-y-2 text-sm leading-relaxed text-key-white/80">{children}</div>
  </section>
);

export const HelpModal = ({ onClose }: Props) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-bg-border bg-bg-surface p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">
              <span className="text-key-white">Piano</span>{' '}
              <span className="text-hand-right">Hero</span>{' '}
              <span className="text-key-white/40">— Aide</span>
            </h2>
            <p className="mt-1 text-xs text-key-white/50">
              Apprends le piano façon Guitar Hero
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-bg-border px-3 py-1 text-sm text-key-white/70 hover:bg-bg-base"
          >
            Fermer
          </button>
        </div>

        <div className="space-y-6">
          <Section title="Qu'est-ce que Piano Hero ?">
            <p>
              Piano Hero est un jeu d'apprentissage du piano. Tu importes un fichier MIDI
              (une partition numérique), des barres colorées tombent vers un clavier
              visuel en bas de l'écran, et tu joues les notes sur ton vrai piano au
              moment où chaque barre touche la ligne de frappe.
            </p>
            <p>
              Plus tu es précis sur le timing, plus tu marques de points. Le but :
              t'entraîner à jouer un morceau en lisant intuitivement les notes qui
              arrivent, sans regarder une partition classique.
            </p>
          </Section>

          <Section title="C'est quoi un fichier MIDI ?">
            <p>
              Un fichier MIDI (.mid ou .midi) ne contient pas de son — c'est une
              <em className="text-hand-right not-italic"> partition numérique</em>.
              Il décrit, pour chaque note : quelle touche de piano, à quel moment, pendant
              combien de temps, et avec quelle intensité.
            </p>
            <p>
              Tu trouves des MIDI gratuits sur des sites comme{' '}
              <span className="font-display text-hand-right">bitmidi.com</span>,{' '}
              <span className="font-display text-hand-right">freemidi.org</span>, ou en
              cherchant "[titre du morceau] midi". Pour le piano, privilégie les fichiers
              issus d'arrangements piano solo plutôt que d'orchestres complets.
            </p>
          </Section>

          <Section title="Pistes : Main droite / Main gauche / Ignorer">
            <p>
              Un fichier MIDI peut contenir plusieurs <em className="not-italic">pistes</em> :
              une pour la mélodie (souvent la plus aiguë), une pour l'accompagnement
              (souvent les graves), parfois aussi batterie, basse, etc.
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <span className="font-display text-hand-right">Main D (droite)</span> :
                la piste sera affichée en bleu et tu devras la jouer avec la main droite.
                Habituellement la mélodie aiguë.
              </li>
              <li>
                <span className="font-display text-hand-left">Main G (gauche)</span> :
                affichée en violet, à jouer avec la main gauche. Habituellement les
                accords/basses.
              </li>
              <li>
                <span className="font-display text-key-white/50">Ignorer</span> : la
                piste n'est ni affichée ni jouée. Pratique pour exclure la batterie ou
                d'autres instruments.
              </li>
            </ul>
            <p>
              Piano Hero affecte automatiquement les pistes à la première ouverture
              (mélodie aiguë → main droite, basses → main gauche), mais tu peux toujours
              changer.
            </p>
          </Section>

          <Section title="Comment ça se joue ?">
            <ol className="ml-4 list-decimal space-y-1">
              <li>Importe un fichier MIDI (drag & drop ou bouton "Parcourir")</li>
              <li>Vérifie l'affectation des pistes (Main D / Main G / Ignorer)</li>
              <li>
                Branche ton piano en USB ou active le clavier d'ordinateur (mode test)
              </li>
              <li>Clique sur "Jouer" puis "Lancer la partie"</li>
              <li>Joue les notes au moment où les barres touchent le clavier visuel</li>
            </ol>
          </Section>

          <Section title="Système de notation">
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <span className="font-display text-feedback-perfect">PERFECT</span> (±40ms)
                — 300 points × multiplicateur de combo
              </li>
              <li>
                <span className="font-display text-feedback-good">GOOD</span> (±100ms) —
                100 points
              </li>
              <li>
                <span className="font-display text-hand-right">OK</span> (±180ms) — 50
                points
              </li>
              <li>
                <span className="font-display text-feedback-miss">MISS</span> — 0 point,
                combo réinitialisé
              </li>
            </ul>
            <p>
              Le combo augmente le multiplicateur :{' '}
              <span className="font-display">×1</span> (0-9),{' '}
              <span className="font-display">×2</span> (10-24),{' '}
              <span className="font-display">×4</span> (25-49),{' '}
              <span className="font-display">×8</span> (50+).
            </p>
            <p>
              Rang final : <span className="font-display text-feedback-perfect">S</span>{' '}
              (95%+), <span className="font-display">A</span> (85%+),{' '}
              <span className="font-display">B</span> (70%+),{' '}
              <span className="font-display">C</span> (50%+),{' '}
              <span className="font-display">D</span> en dessous.
            </p>
          </Section>

          <Section title="Réglages essentiels">
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <span className="font-display text-hand-right">Vitesse de chute</span> :
                temps que met une barre pour traverser l'écran. Plus c'est court, plus
                c'est dur (moins d'anticipation).
              </li>
              <li>
                <span className="font-display text-hand-right">Latence</span> :
                compense le délai entre la frappe sur ton piano et la détection
                logicielle. Si tu vois "GOOD" alors que tu visais "PERFECT", ajuste de
                ±20ms et réessaie.
              </li>
              <li>
                <span className="font-display text-hand-right">Audio preview</span> :
                joue le morceau via un synthé léger pendant la partie. Utile pour
                entendre ce qu'on joue ou pour s'entraîner sans piano.
              </li>
            </ul>
          </Section>

          <Section title="Connexion piano MIDI">
            <p>
              Branche ton piano en USB → l'app le détecte automatiquement (point vert
              dans le header). Si rien n'apparaît : vérifie que le piano est allumé et
              que le câble n'est pas endommagé. Sur Chrome/Edge uniquement (la Web MIDI
              API n'est pas supportée par Firefox/Safari).
            </p>
            <p>
              Pas de piano ? Active le clavier d'ordinateur sur l'écran d'accueil :
              les touches <span className="font-display">Q S D F G H J K L M</span>{' '}
              jouent une octave de Do à Mi, et <span className="font-display">Z E T Y U O P</span>{' '}
              les dièses correspondants.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};
