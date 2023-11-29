import GroupSettingsSSORoot from '../../../../../../modules/group-settings/frontend/js/components/sso/group-settings-sso-root'

function GroupSettingsSSOComponent() {
  return (
    <div style={{ padding: '25px', width: '600px' }}>
      <GroupSettingsSSORoot managedUsersEnabled />
    </div>
  )
}

const GROUP_ID = '123abc'

describe('GroupSettingsSSO', function () {
  beforeEach(function () {
    cy.window().then(win => {
      win.metaAttributesCache = new Map()
      win.metaAttributesCache.set('ol-groupId', GROUP_ID)
    })
  })

  it('renders sso settings in group management', function () {
    cy.mount(<GroupSettingsSSOComponent />)

    cy.get('.group-settings-sso').within(() => {
      cy.contains('Single Sign-On (SSO)')
      cy.contains('Enable SSO')
    })
  })

  describe('GroupSettingsSSOEnable', function () {
    it('renders without sso configuration', function () {
      cy.mount(<GroupSettingsSSOComponent />)

      cy.contains('Enable SSO')
      cy.contains(
        'Set up single sign-on for your group. This sign in method will be optional for group members unless Managed Users is enabled.'
      )
      cy.get('.switch-input').within(() => {
        cy.get('.invisible-input').should('not.be.checked')
        cy.get('.invisible-input').should('be.disabled')
      })
    })

    it('renders with sso configuration', function () {
      cy.intercept('GET', `/manage/groups/${GROUP_ID}/settings/sso`, {
        statusCode: 200,
        body: {
          entryPoint: 'entrypoint',
          certificates: ['cert1', 'cert2'],
          signatureAlgorithm: 'sha1',
          userIdAttribute: 'email',
          enabled: true,
        },
      }).as('sso')

      cy.mount(<GroupSettingsSSOComponent />)

      cy.wait('@sso')

      cy.get('.switch-input').within(() => {
        cy.get('.invisible-input').should('be.checked')
        cy.get('.invisible-input').should('not.be.disabled')
      })
    })

    it('updates the configuration, and checks the success message', function () {
      cy.intercept('GET', `/manage/groups/${GROUP_ID}/settings/sso`, {
        statusCode: 200,
        body: {
          entryPoint: 'entrypoint',
          certificates: ['cert'],
          signatureAlgorithm: 'sha1',
          userIdAttribute: 'email',
          enabled: true,
        },
      }).as('sso')

      cy.intercept('POST', `/manage/groups/${GROUP_ID}/settings/sso`, {
        statusCode: 200,
        body: {
          entryPoint: 'entrypoint',
          certificates: ['certi'],
          signatureAlgorithm: 'sha1',
          userIdAttribute: 'email',
          enabled: false,
        },
      }).as('ssoUpdated')

      cy.mount(<GroupSettingsSSOComponent />)

      cy.wait('@sso')

      cy.get('.switch-input').within(() => {
        cy.get('.invisible-input').should('be.checked')
        cy.get('.invisible-input').should('not.be.disabled')
      })

      cy.findByRole('button', { name: 'View configuration' }).click()
      cy.findByRole('button', { name: 'Edit configuration' }).click()
      cy.findByRole('button', { name: 'Save' }).click()
      cy.wait('@ssoUpdated')
      cy.findByText('SSO configuration was updated successfully')
    })

    describe('sso enable modal', function () {
      beforeEach(function () {
        cy.intercept('GET', `/manage/groups/${GROUP_ID}/settings/sso`, {
          statusCode: 200,
          body: {
            entryPoint: 'entrypoint',
            certificates: ['cert'],
            signatureAlgorithm: 'sha1',
            userIdAttribute: 'email',
            enabled: false,
          },
        }).as('sso')

        cy.mount(<GroupSettingsSSOComponent />)

        cy.wait('@sso')

        cy.get('.switch-input').within(() => {
          cy.get('.invisible-input').click({ force: true })
        })
      })

      it('render enable modal correctly', function () {
        // enable modal
        cy.get('.modal-dialog').within(() => {
          cy.contains('Enable single sign-on')
          cy.contains('What happens when SSO is enabled?')
        })
      })

      it('close enable modal if Cancel button is clicked', function () {
        cy.get('.modal-dialog').within(() => {
          cy.findByRole('button', { name: 'Cancel' }).click()
        })

        cy.get('.modal-dialog').should('not.exist')
      })

      it('enables SSO if Enable SSO button is clicked and shows success banner', function () {
        cy.intercept('POST', `/manage/groups/${GROUP_ID}/settings/enableSSO`, {
          statusCode: 200,
        }).as('enableSSO')

        cy.intercept('GET', `/manage/groups/${GROUP_ID}/settings/sso`, {
          statusCode: 200,
          body: {
            entryPoint: 'entrypoint',
            certificates: ['cert'],
            signatureAlgorithm: 'sha1',
            userIdAttribute: 'email',
            enabled: true,
          },
        }).as('sso')

        cy.get('.modal-dialog').within(() => {
          cy.findByRole('button', { name: 'Enable SSO' }).click()
        })
        cy.get('.modal-dialog').should('not.exist')

        cy.get('.switch-input').within(() => {
          cy.get('.invisible-input').should('be.checked')
          cy.get('.invisible-input').should('not.be.disabled')
        })

        cy.findByText('SSO is enabled')
      })
    })

    describe('SSO disable modal', function () {
      beforeEach(function () {
        cy.intercept('GET', `/manage/groups/${GROUP_ID}/settings/sso`, {
          statusCode: 200,
          body: {
            entryPoint: 'entrypoint',
            certificates: ['cert'],
            signatureAlgorithm: 'sha1',
            userIdAttribute: 'email',
            enabled: true,
          },
        }).as('sso')

        cy.mount(<GroupSettingsSSOComponent />)

        cy.wait('@sso')

        cy.get('.switch-input').within(() => {
          cy.get('.invisible-input').click({ force: true })
        })
      })

      it('render disable modal correctly', function () {
        // disable modal
        cy.get('.modal-dialog').within(() => {
          cy.contains('Disable single sign-on')
          cy.contains(
            'You’re about to disable single sign-on for all group members.'
          )
        })
      })

      it('close disable modal if Cancel button is clicked', function () {
        cy.get('.modal-dialog').within(() => {
          cy.findByRole('button', { name: 'Cancel' }).click()
        })

        cy.get('.modal-dialog').should('not.exist')
      })

      it('disables SSO if Disable SSO button is clicked and shows success banner', function () {
        cy.intercept('POST', `/manage/groups/${GROUP_ID}/settings/disableSSO`, {
          statusCode: 200,
        }).as('disableSSO')

        cy.intercept('GET', `/manage/groups/${GROUP_ID}/settings/sso`, {
          statusCode: 200,
          body: {
            entryPoint: 'entrypoint',
            certificates: ['cert'],
            signatureAlgorithm: 'sha1',
            userIdAttribute: 'email',
            enabled: false,
          },
        }).as('sso')

        cy.get('.modal-dialog').within(() => {
          cy.findByRole('button', { name: 'Disable SSO' }).click()
        })
        cy.get('.modal-dialog').should('not.exist')

        cy.get('.switch-input').within(() => {
          cy.get('.invisible-input').should('not.be.checked')
        })

        cy.findByText('SSO is disabled')
      })
    })
  })
})
