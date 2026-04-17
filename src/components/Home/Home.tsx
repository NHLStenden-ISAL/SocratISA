import './Home.css'

interface HomeProps {
  onStartSurvey: () => void;
}

export const Home = ({ onStartSurvey }: HomeProps) => {
  return (
    <div className="article">
      <h1>Generatieve AI: wat is het?</h1>
      
      <section className="article-text">
        <p>
          De kans is groot dat je ChatGPT, Copilot of een vergelijkbare tool al eens hebt gebruikt.
          Bijvoorbeeld voor je huiswerk, een brainstormsessie of om snel een samenvatting te krijgen van een lange e-mail.
          Het werkt snel, het is makkelijk, en het resultaat ziet er vaak indrukwekkend uit.
        </p>
        <p>
          Maar wat gebeurt er eigenlijk achter de schermen?
          Waarom kan een AI zo overtuigend klinken en toch ongelijk hebben?
          En wat gebeurt er met je gegevens wanneer je ze deelt met zo'n dienst?
          Op deze pagina gaan we die vragen, en meer, beantwoorden.
        </p>
      </section>

      <h2>Generatieve AI in de praktijk</h2>
      <section className="article-text">
        <p>
          Generatieve AI is geen magie. Het is statistiek op enorme schaal.
          Modellen zoals GPT zijn getraind op miljarden teksten, afbeeldingen en andere data.
          Al die voorbeelden worden omgezet in reeksen van getallen genaamd parameters, waarmee het model
          patronen leert herkennen.
          Wanneer je een vraag stelt, gebruikt het model die parameters om op basis van
          jouw invoer woord voor woord het meest logische vervolg te voorspellen.
        </p>
        <p>
          Dat betekent dat antwoorden er logisch en overtuigend uit kunnen zien,
          zonder dat het model daadwerkelijk begrijpt wat het zegt.
          Het kan feiten verwarren, dingen verzinnen die niet bestaan,
          of bestaande vooroordelen uit de trainingsdata herhalen, zonder dat jij het doorhebt.
          Het model weet alleen wat er in zijn trainingsdata zat. Het weet niets over
          gebeurtenissen die daarna hebben plaatsgevonden, tenzij het toegang heeft tot
          externe tools zoals een webzoekfunctie, waar we later op terugkomen.
        </p>
      </section>

      <h2>Toepassingen van Generatieve AI</h2>
      <section className="article-text">
        <p>
          Tekst genereren is slechts één kant van het verhaal.
          Moderne AI-systemen combineren verschillende technieken om slimmere
          en betrouwbaardere resultaten te leveren. Hier zijn drie belangrijke voorbeelden:
        </p>
      </section>
      <section className="example-grid">
        <div className="example-box">
          <h3>Retrieval Augmented Generation</h3>
          <p>
            RAG combineert een AI-model met externe informatiebronnen.
            In plaats van alleen op trainingsdata te vertrouwen, zoekt het systeem eerst
            naar relevante documenten en gebruikt die als context voor het antwoord.
            Zo krijg je actuelere en betrouwbaardere resultaten.
          </p>
        </div>
        <div className="example-box">
          <h3>Computer Vision</h3>
          <p>
            Computer Vision stelt AI in staat om afbeeldingen en video's te analyseren.
            Het kan objecten herkennen, tekst uit afbeeldingen halen of zelfs de inhoud
            van een foto beschrijven. Denk aan automatische gezichtsherkenning of tekst uit documenten halen.
          </p>
        </div>
        <div className="example-box">
          <h3>Tool Calling</h3>
          <p>
            Bij Tool Calling kan een AI-model zelf hulpmiddelen buiten zichzelf gebruiken.
            Een belangrijk voorbeeld is web search: als je vraagt om actuele informatie,
            kan het model zelf op internet zoeken. Of je vraagt om een ingewikkelde berekening:
            dan schakelt het een rekenhulp in. Het model beslist zelf wanneer het externe hulp nodig heeft.
          </p>
        </div>
      </section>
      <section className="article-text">
        <p>
          En dit zijn pas drie toepassingen. Denk ook aan AI die kan programmeren, audio kan transcriberen,
          presentaties kan opbouwen of kan helpen bij het vertalen van documenten.
          Denk na: welke van deze mogelijkheden zou jouw werk of studie écht kunnen
          verbeteren als je ze slim inzet?
        </p>
      </section>

      <h2>Valkuilen bij AI-gebruik</h2>
      <section className="article-text">
        <p>
          Generatieve AI is krachtig, maar maakt fouten.
          Het grootste risico is dat je antwoorden overneemt zonder ze te controleren.
          Een AI kan onjuiste informatie op een volkomen overtuigende manier presenteren
          compleet met verzonnen bronnen die niet bestaan. Daarnaast worden je gegevens vaak opgeslagen wanneer je ze deelt met externe diensten.
          Ze kunnen die data gebruiken voor toekomstige training of het kan per ongeluk gelekt worden,
          wat privacyrisico's met zich meebrengt.
        </p>
        <p>
          Het verschil tussen goed en slecht AI-gebruik zit vaak in één ding:
          de vraag die je stelt, en hoe je met het antwoord omgaat.
        </p>
      </section>

      <section className="pitfalls-grid">
        <div className="pitfall-box bad">
          <h3>Geen controle</h3>
          <p>
            "Schrijf mijn verslag over de Tweede Wereldoorlog"
            Je neemt het resultaat over zonder het te controleren op feiten.
            Het verslag bevat onjuiste data en verzonnen bronnen.
          </p>
        </div>
        <div className="pitfall-box good">
          <h3>Kritisch gebruiken</h3>
          <p>
            "Geef mij een structuur voor een verslag over de Tweede Wereldoorlog,
            gericht op de economische gevolgen"
            Je gebruikt de output als startpunt, controleert de feiten zelf
            en schrijft de inhoud op basis van betrouwbare bronnen.
          </p>
        </div>
        <div className="pitfall-box bad">
          <h3>Privacy negeren</h3>
          <p>
            Je plakt een volledig patiëntendossier of persoonlijk document in ChatGPT
            om een samenvatting te krijgen, zonder na te denken over waar die gegevens terechtkomen.
          </p>
        </div>
        <div className="pitfall-box good">
          <h3>Privacy bewust</h3>
          <p>
            Je anonymiseert gevoelige informatie voordat je die deelt met een AI-dienst,
            of kiest voor een lokale oplossing waarbij je gegevens je eigen apparaat niet verlaten.
          </p>
        </div>
        <div className="pitfall-box bad">
          <h3>Blind vertrouwen</h3>
          <p>
            Je vraagt AI om een medisch advies en volgt het op zonder een arts te raadplegen.
            Het model kan overtuigend klinken, maar het is geen vervanging
            voor een echte professional met actuele kennis.
          </p>
        </div>
        <div className="pitfall-box good">
          <h3>AI als hulpmiddel</h3>
          <p>
            Je gebruikt AI om je vraag scherper te formuleren of om een tweede perspectief te krijgen,
            en bespreekt het resultaat vervolgens met een professional.
            Zo haal je het beste uit beide werelden.
          </p>
        </div>
      </section>

      <h2>De Socratische Methode</h2>
      <section className="article-text">
        <p>
          De meeste AI-tools geven je een direct antwoord op je vraag.
          Dat is handig, maar het zorgt er ook voor dat je zelf minder nadenkt.
          De socratische methode draait dit om: in plaats van antwoorden te geven,
          stelt het systeem vragen die jou aan het denken zetten.
        </p>
        <p>
          De methode is vernoemd naar de Griekse filosoof Socrates, die zijn leerlingen
          nooit zomaar een antwoord gaf. In plaats daarvan stelde hij doorlopend vragen
          waardoor ze zelf tot inzicht kwamen. Het idee is simpel: als je zelf een antwoord
          ontdekt, begrijp je het beter en onthoud je het langer dan wanneer iemand het je vertelt.
        </p>
        <p>
          Bij socratische AI word je dus niet geleid naar een kant-en-klaar antwoord,
          maar word je uitgedaagd om zelf tot een oplossing te komen.
          Dat is precies waarom het zo waardevol is in een leeromgeving:
          het helpt je om daadwerkelijk te begrijpen wat je doet, in plaats van
          alleen maar het juiste antwoord over te typen.
        </p>
      </section>

      <h2>Aan de slag</h2>
      <section className="article-text">
        <p>
          Nu je weet wat generatieve AI is, welke toepassingen er zijn en waar de risico's zitten,
          is het tijd om zelf aan de slag te gaan. In het volgende onderdeel vul je een korte vragenlijst in
          over jezelf, je vakgebied en je manier van leren. Op basis daarvan wordt een socratische prompt voor je samengesteld: dit is de
          instructie die je bij een AI-dienst invoert om socratisch met het model te werken.
        </p>
        <p>
          De prompt wordt lokaal op je apparaat samengesteld, zodat je persoonlijke gegevens
          je browser niet verlaten. Niet helemaal tevreden met het resultaat?
          Je kunt de prompt aanpassen, of opnieuw laten genereren tot die goed zit.
        </p>
      </section>

      <div className="button-container">
        <button className="socratic-button" onClick={onStartSurvey}>
          Maak een socratische prompt
        </button>
      </div>
    </div>
  );
};
